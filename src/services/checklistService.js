import { supabase } from "./supabaseClient";

export async function getChecklistItems() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("departure_checklist")
    .select("id, title, description, is_done, sort_order, created_at")
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createChecklistItem({ title, description }) {
  if (!supabase) throw new Error("Configurez Supabase avant d'enregistrer la checklist.");
  const { data, error } = await supabase
    .from("departure_checklist")
    .insert({ title: title.trim(), description: description.trim() })
    .select("id, title, description, is_done, sort_order, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setChecklistItemDone(id, isDone) {
  if (!supabase) throw new Error("Configurez Supabase avant de modifier la checklist.");
  const { data, error } = await supabase
    .from("departure_checklist")
    .update({ is_done: isDone })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeChecklistItem(id) {
  if (!supabase) throw new Error("Configurez Supabase avant de modifier la checklist.");
  const { error } = await supabase.from("departure_checklist").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
