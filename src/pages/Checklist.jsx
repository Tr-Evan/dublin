import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Circle, ListChecks, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useAdminAuth } from "../auth/AdminAuth";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import SectionHeading from "../components/ui/SectionHeading";
import useChecklist from "../hooks/useChecklist";
import { createChecklistItem, removeChecklistItem, setChecklistItemDone } from "../services/checklistService";
import { supabase } from "../services/supabaseClient";

export default function Checklist() {
  const { session } = useAdminAuth();
  const { items, setItems, loading, error: loadError, refresh } = useChecklist();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const completedCount = items.filter((item) => item.is_done).length;
  const sortedItems = [...items].sort((first, second) => Number(first.is_done) - Number(second.is_done));

  async function addItem(event) {
    event.preventDefault();
    setBusy("add");
    setError("");
    try {
      const item = await createChecklistItem({ title, description });
      setItems((current) => [...current, item]);
      setTitle("");
      setDescription("");
    } catch (saveError) {
      setError(`Impossible d'ajouter cet élément. ${saveError.message}`);
    } finally {
      setBusy("");
    }
  }

  async function toggleItem(item) {
    const nextDone = !item.is_done;
    setBusy(item.id);
    setError("");
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_done: nextDone } : entry));
    try {
      await setChecklistItemDone(item.id, nextDone);
    } catch (updateError) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_done: item.is_done } : entry));
      setError(`Impossible d'enregistrer la modification. ${updateError.message}`);
    } finally {
      setBusy("");
    }
  }

  async function deleteItem(item) {
    setBusy(item.id);
    setError("");
    try {
      await removeChecklistItem(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (deleteError) {
      setError(`Impossible de supprimer cet élément. ${deleteError.message}`);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hero-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-9">
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div><Badge tone="mint" icon={ListChecks}>Enola & Evan</Badge><h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Checklist du duo.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Les essentiels à acheter et à emporter. La liste se synchronise entre les appareils connectés.</p></div>
          <div className="glass-card rounded-2xl px-5 py-3"><p className="text-2xl font-semibold text-white">{completedCount}<span className="text-muted"> / {items.length}</span></p><p className="text-xs text-muted">choses prêtes</p></div>
        </div>
      </motion.section>

      {!supabase && <p role="alert" className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4 text-sm text-amber-100">Configurez Supabase pour synchroniser cette liste entre les appareils connectés.</p>}
      {(error || loadError) && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{error || loadError}</p>}

      <section className="glass-card rounded-3xl p-5 sm:p-6">
        <SectionHeading eyebrow="Une petite chose à ne pas oublier" title="Ajouter à la liste" />
        <form onSubmit={(event) => void addItem(event)} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="text-xs font-medium text-slate-300">Titre<input required maxLength={120} disabled={!session || busy === "add"} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Acheter des adaptateurs" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none transition focus:border-mint/40 disabled:opacity-50" /></label>
          <label className="text-xs font-medium text-slate-300">Description <span className="text-muted">(facultative)</span><input maxLength={400} disabled={!session || busy === "add"} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex. Celui dans le tiroir du salon" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none transition focus:border-mint/40 disabled:opacity-50" /></label>
          <Button type="submit" icon={busy === "add" ? LoaderCircle : Plus} disabled={!session || busy === "add" || !title.trim()}>{busy === "add" ? "Ajout…" : "Ajouter"}</Button>
        </form>
        {!session && <p className="mt-3 text-xs text-muted">Connexion à l'espace admin requise pour ajouter et cocher des éléments.</p>}
      </section>

      <section>
        <SectionHeading eyebrow="La checklist partagée" title="Tout est dans le sac ?" description={loading ? "Mise à jour de la liste…" : `${items.length - completedCount} élément${items.length - completedCount === 1 ? "" : "s"} à préparer · ${completedCount} déjà prêt${completedCount === 1 ? "" : "s"}.`} />
        {sortedItems.length ? (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedItems.map((item, index) => (
              <motion.li key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.25) }} className={`glass-card flex items-start gap-3 rounded-2xl p-4 transition ${item.is_done ? "border-mint/15 bg-mint/[0.025]" : ""}`}>
                <button type="button" disabled={!session || busy === item.id} onClick={() => void toggleItem(item)} className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition disabled:cursor-not-allowed ${item.is_done ? "border-mint/30 bg-mint/10 text-mint" : "border-white/15 text-transparent hover:border-mint/40"}`} aria-label={`${item.is_done ? "Décocher" : "Cocher"} ${item.title}`} aria-pressed={item.is_done}>
                  {item.is_done ? <Check size={16} /> : <Circle size={14} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-5 transition ${item.is_done ? "text-muted line-through" : "text-white"}`}>{item.title}</p>
                  {item.description && <p className={`mt-1 text-xs leading-5 ${item.is_done ? "text-muted/70 line-through" : "text-slate-400"}`}>{item.description}</p>}
                </div>
                {session && <button type="button" disabled={busy === item.id} onClick={() => void deleteItem(item)} aria-label={`Supprimer ${item.title}`} className="rounded-xl p-2 text-muted transition hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"><Trash2 size={15} /></button>}
              </motion.li>
            ))}
          </ul>
        ) : <div className="glass-card rounded-3xl p-10 text-center"><ListChecks size={27} className="mx-auto text-mint" /><p className="mt-3 font-medium text-white">{loading ? "Chargement de la liste…" : "La liste est vide pour le moment."}</p><p className="mt-1 text-sm text-muted">Ajoutez le premier indispensable du voyage.</p></div>}
        {session && <button type="button" onClick={() => void refresh()} className="mt-4 text-xs font-medium text-mint hover:text-emerald-200">Actualiser la checklist</button>}
      </section>
    </div>
  );
}
