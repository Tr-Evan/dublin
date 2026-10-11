import { supabase } from "./supabaseClient";

const locationCacheKey = "dublin-family-location-markers";

export function getCachedFamilyLocations() {
  try {
    const cached = localStorage.getItem(locationCacheKey);
    const parsed = cached ? JSON.parse(cached) : [];
    return Array.isArray(parsed) ? parsed.filter((location) => (
      typeof location.user_id === "string"
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
    .select("user_id, display_name, latitude, longitude, updated_at")
    .order("display_name");
  if (error) throw new Error(error.message);
  const locations = data ?? [];
  cacheFamilyLocations(locations);
  return locations;
}

export async function publishApproximateLocation(latitude, longitude) {
  if (!supabase) throw new Error("Configurez Supabase pour activer le partage familial.");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Impossible de vérifier la session : ${authError.message}`);
  if (!user) throw new Error("Connectez-vous pour activer votre partage.");

  const metadata = user.user_metadata ?? {};
  const displayName = [metadata.display_name, metadata.name, metadata.first_name]
    .find((name) => typeof name === "string" && name.trim())
    ?.trim() || "Voyageur";

  const { error } = await supabase.from("family_location_markers").upsert(
    {
      user_id: user.id,
      display_name: displayName.slice(0, 80),
      latitude: Number(latitude.toFixed(3)),
      longitude: Number(longitude.toFixed(3)),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}
