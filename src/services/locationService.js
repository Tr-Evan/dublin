import { supabase } from "./supabaseClient";

export async function publishApproximateLocation(latitude, longitude) {
  if (!supabase) throw new Error("Configurez Supabase pour activer le partage familial.");
  const { error } = await supabase.from("family_locations").upsert(
    {
      id: "dublin-trip",
      latitude: Number(latitude.toFixed(3)),
      longitude: Number(longitude.toFixed(3)),
      is_sharing: true,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}

export async function stopLocationSharing() {
  if (!supabase) throw new Error("Configurez Supabase pour gérer le partage familial.");
  const { error } = await supabase.from("family_locations").delete().eq("id", "dublin-trip");
  if (error) throw new Error(error.message);
}
