import { supabase } from "./supabaseClient";

const expenseFields = "id, title, amount, paid_by, expense_date, is_shared, is_reimbursement, created_at, created_by";

export async function getExpenses() {
  if (!supabase) throw new Error("Configurez Supabase pour consulter le budget partagé.");
  const { data, error } = await supabase
    .from("expenses")
    .select(expenseFields)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addExpense({ title, amount, paidBy, expenseDate, isShared, isReimbursement = false }) {
  if (!supabase) throw new Error("Configurez Supabase pour enregistrer une dépense.");
  const cleanedTitle = title.trim();
  const parsedAmount = Number(amount);
  if (!cleanedTitle || cleanedTitle.length > 160) throw new Error("Précisez une dépense (160 caractères maximum).");
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) throw new Error("Le montant doit être supérieur à zéro.");
  if (!["Evan", "Enola"].includes(paidBy)) throw new Error("Choisissez qui a réglé la dépense.");
  const parsedDate = new Date(`${expenseDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== expenseDate) {
    throw new Error("Choisissez une date de dépense valide.");
  }
  if (typeof isShared !== "boolean") throw new Error("Précisez si la dépense doit être divisée.");
  if (typeof isReimbursement !== "boolean") throw new Error("Précisez si la transaction est un remboursement.");
  if (isReimbursement && isShared) throw new Error("Un remboursement ne peut pas être une dépense à diviser.");

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      title: cleanedTitle,
      amount: parsedAmount,
      paid_by: paidBy,
      expense_date: expenseDate,
      is_shared: isShared,
      is_reimbursement: isReimbursement,
    })
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
