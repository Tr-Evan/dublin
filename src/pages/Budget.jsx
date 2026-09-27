import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, LoaderCircle, Plus, ReceiptEuro, Trash2, Wallet } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import SectionHeading from "../components/ui/SectionHeading";
import { supabase } from "../services/supabaseClient";
import { addExpense, deleteExpense, getExpenses } from "../services/budgetService";

const people = ["Evan", "Enola"];
const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none focus:border-mint/40";

function getSettlement(expenses) {
  const paid = expenses.reduce((totals, expense) => {
    totals[expense.paid_by] += Number(expense.amount);
    return totals;
  }, { Evan: 0, Enola: 0 });
  const amount = Math.round(Math.abs(paid.Evan - paid.Enola) / 2 * 100) / 100;
  if (amount < 0.01) return { amount: 0, message: "Les comptes sont équilibrés.", debtor: null, creditor: null };
  return paid.Evan > paid.Enola
    ? { amount, message: "Enola doit à Evan", debtor: "Enola", creditor: "Evan" }
    : { amount, message: "Evan doit à Enola", debtor: "Evan", creditor: "Enola" };
}

export default function Budget() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("Evan");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setExpenses(await getExpenses());
      setError("");
    } catch (loadError) {
      setError(`Impossible de charger le budget. ${loadError.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!supabase) return undefined;
    const channel = supabase.channel("shared-expenses")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  const settlement = useMemo(() => getSettlement(expenses), [expenses]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addExpense({ title, amount, paidBy });
      setTitle("");
      setAmount("");
      await refresh();
    } catch (saveError) {
      setError(`Impossible d'ajouter la dépense. ${saveError.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeExpense(expense) {
    if (!window.confirm(`Supprimer la dépense « ${expense.title} » ?`)) return;
    setError("");
    try {
      await deleteExpense(expense.id);
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    } catch (deleteError) {
      setError(`Impossible de supprimer la dépense. ${deleteError.message}`);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <section className="hero-panel rounded-[2rem] p-6 sm:p-9">
        <Badge tone="mint" icon={Wallet}>Evan & Enola · budget partagé</Badge>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Les comptes du voyage</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Ajoutez les dépenses communes pour garder une balance claire entre les deux voyageurs.</p>
      </section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl border p-6 sm:p-8 ${settlement.amount ? "border-amber-200/20 bg-amber-200/[0.06]" : "border-mint/20 bg-mint/[0.06]"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Balance actuelle</p>
        <p className={`mt-3 text-2xl font-semibold sm:text-4xl ${settlement.amount ? "text-amber-100" : "text-mint"}`}>
          {settlement.amount ? `${settlement.message} ${euros.format(settlement.amount)}` : settlement.message}
        </p>
        <p className="mt-3 text-sm text-slate-400">Total partagé : {euros.format(expenses.reduce((sum, item) => sum + Number(item.amount), 0))}</p>
      </motion.section>

      <section className="glass-card rounded-3xl p-5 sm:p-6">
        <SectionHeading eyebrow="Ajouter une dépense" title="Qui a réglé quoi ?" />
        <form onSubmit={(event) => void submit(event)} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] sm:items-end">
          <label className="text-xs font-medium text-slate-300">Quoi ?<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Dîner du premier soir" className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-300">Combien ?<input required type="number" min="0.01" max="99999999.99" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00 €" className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-300">Payé par<select value={paidBy} onChange={(event) => setPaidBy(event.target.value)} className={inputClass}>{people.map((person) => <option key={person}>{person}</option>)}</select></label>
          <Button type="submit" icon={busy ? LoaderCircle : Plus} disabled={busy}>{busy ? "Ajout…" : "Ajouter"}</Button>
        </form>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200">{error}</p>}
      </section>

      <section>
        <SectionHeading eyebrow="Dépenses communes" title="Le détail" />
        {loading ? <p className="flex items-center gap-2 text-sm text-muted"><LoaderCircle size={16} className="animate-spin" />Chargement des dépenses…</p>
          : expenses.length ? (
            <ul className="space-y-3">
              {expenses.map((expense) => (
                <li key={expense.id} className="glass-card flex items-center gap-3 rounded-2xl p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint/[0.08] text-mint"><ReceiptEuro size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{expense.title}</p>
                    <p className="mt-1 text-xs text-muted">{expense.paid_by} a payé · {new Date(expense.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-white">{euros.format(Number(expense.amount))}</p>
                  <button type="button" onClick={() => void removeExpense(expense)} aria-label={`Supprimer ${expense.title}`} className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-400/10 hover:text-rose-200"><Trash2 size={17} /></button>
                </li>
              ))}
            </ul>
          ) : <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted"><ArrowLeftRight size={20} className="mx-auto mb-2 text-mint" />Aucune dépense pour le moment.</div>}
      </section>
    </div>
  );
}
