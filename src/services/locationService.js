import { supabase } from "./supabaseClient";

const locationCacheKey = "dublin-family-location-markers";
const travelerNames = ["Evan", "Enola"];

export function resolveTravelerName(user) {
  const candidates = [
    user?.user_metadata?.traveler_name,
    user?.user_metadata?.full_name,
    user?.user_metadata?.name,
    user?.email?.split("@")[0],
  ];
  const match = candidates
    .filter((candidate) => typeof candidate === "string")
    .map((candidate) => travelerNames.find((name) => new RegExp(`(^|[^a-z])${name.toLowerCase()}([^a-z]|$)`, "i").test(candidate)))
    .find(Boolean);
  if (!match) throw new Error("Le compte connecté doit être identifié comme Evan ou Enola (nom de profil ou adresse e-mail).");
  return match;
}

export function getCachedFamilyLocations() {
  try {
    const cached = localStorage.getItem(locationCacheKey);
    const parsed = cached ? JSON.parse(cached) : [];
    return Array.isArray(parsed) ? parsed.filter((location) => (
      travelerNames.includes(location.traveler)
      && Number.isFinite(Number(location.latitude))
      && Number.isFinite(Number(location.longitude))
    )) : [];
  } catch (error) {
    console.warn("Impossible de restaurer les dernières positions mises en cache.", error);
    return [];
  }
}

function cacheFamilyLocations(locations) {
  try {
    localStorage.setItem(locationCacheKey, JSON.stringify(locations));
  } catch (error) {
    console.warn("Impossible de conserver les dernières positions hors ligne.", error);
  }
}

export async function getFamilyLocations() {
  if (!supabase || navigator.onLine === false) return getCachedFamilyLocations();
  const { data, error } = await supabase
    .from("family_location_markers")
    .select("traveler, latitude, longitude, updated_at")
    .order("traveler");
  if (error) throw new Error(error.message);
  const locations = data ?? [];
  cacheFamilyLocations(locations);
  return locations;
}

export async function publishApproximateLocation(latitude, longitude, user) {
  if (!supabase) throw new Error("Configurez Supabase pour activer le partage familial.");
  if (!user?.id) throw new Error("Une session administrateur est nécessaire pour partager la position.");
  const traveler = resolveTravelerName(user);
  const { error } = await supabase.from("family_location_markers").upsert(
    {
      traveler,
      user_id: user.id,
      latitude: Number(latitude.toFixed(3)),
      longitude: Number(longitude.toFixed(3)),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "traveler" },
  );
  if (error) throw new Error(error.message);
}
