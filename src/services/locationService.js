import { supabase } from "./supabaseClient";

const locationCacheKey = "dublin-family-location-markers";
const travelerNames = ["Evan", "Enola"];
const unauthorizedLocationMessage = "Compte non autorisé à partager sa position.";

export function resolveTravelerName(user) {
  const metadata = user?.user_metadata ?? {};
  const metadataName = [metadata.display_name, metadata.name, metadata.first_name]
    .find((name) => typeof name === "string" && travelerNames.includes(name.trim().toLowerCase()));
  if (metadataName) {
    return travelerNames.find((name) => name.toLowerCase() === metadataName.trim().toLowerCase());
  }

  const userId = user?.id;
  if (userId && userId === import.meta.env.VITE_EVAN_USER_ID) return "Evan";
  if (userId && userId === import.meta.env.VITE_ENOLA_USER_ID) return "Enola";

  throw new Error(unauthorizedLocationMessage);
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

export async function publishApproximateLocation(latitude, longitude, user, traveler = resolveTravelerName(user)) {
  if (!supabase) throw new Error("Configurez Supabase pour activer le partage familial.");
  if (!user?.id) throw new Error("Une session administrateur est nécessaire pour partager la position.");
  if (!travelerNames.includes(traveler)) throw new Error("Le nom du voyageur doit être Evan ou Enola.");
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
