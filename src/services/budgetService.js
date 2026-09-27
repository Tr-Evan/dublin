import { supabase } from "./supabaseClient";

const expenseFields = "id, title, amount, paid_by, created_at, created_by";

export async function getExpenses() {
  if (!supabase) throw new Error("Configurez Supabase pour consulter le budget partagé.");
  const { data, error } = await supabase
    .from("expenses")
    .select(expenseFields)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addExpense({ title, amount, paidBy }) {
  if (!supabase) throw new Error("Configurez Supabase pour enregistrer une dépense.");
  const cleanedTitle = title.trim();
  const parsedAmount = Number(amount);
  if (!cleanedTitle || cleanedTitle.length > 160) throw new Error("Précisez une dépense (160 caractères maximum).");
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) throw new Error("Le montant doit être supérieur à zéro.");
  if (!["Evan", "Enola"].includes(paidBy)) throw new Error("Choisissez qui a réglé la dépense.");

  const { data, error } = await supabase
    .from("expenses")
    .insert({ title: cleanedTitle, amount: parsedAmount, paid_by: paidBy })
    .select(expenseFields)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteExpense(id) {
  if (!supabase) throw new Error("Configurez Supabase pour supprimer une dépense.");
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
