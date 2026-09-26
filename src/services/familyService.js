import { supabase } from "./supabaseClient";

export async function getSchedule() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("day_schedule")
    .select("id, place_id, visit_date, sort_order, visited, places(id, kind, name, address)")
    .order("visit_date")
    .order("sort_order");
  if (error) throw new Error(error.message);
  try {
    localStorage.setItem("dublin-v2:family-schedule", JSON.stringify(data ?? []));
  } catch {
    // The live response remains available when the browser cannot persist a public itinerary cache.
  }
  return data ?? [];
}

export async function getSharedLocation() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("family_locations")
    .select("latitude, longitude, updated_at")
    .eq("id", "dublin-trip")
    .eq("is_sharing", true)
    .gt("updated_at", new Date(Date.now() - 5 * 60_000).toISOString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export function getCachedSchedule() {
  try {
    const cached = localStorage.getItem("dublin-v2:family-schedule");
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

export async function setActivityDate(placeId, visitDate) {
  if (!supabase) throw new Error("Configurez Supabase avant de planifier une visite.");
  if (!visitDate) {
    const { error } = await supabase.from("day_schedule").delete().eq("place_id", placeId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("day_schedule").upsert(
    { place_id: placeId, visit_date: visitDate, visited: false },
    { onConflict: "place_id" },
  );
  if (error) throw new Error(error.message);
}

export async function setActivityVisited(scheduleId, visited) {
  if (!supabase) throw new Error("Configurez Supabase avant de modifier la progression.");
  const { error } = await supabase.from("day_schedule").update({ visited }).eq("id", scheduleId);
  if (error) throw new Error(error.message);
}
