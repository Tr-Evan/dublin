import { useState } from "react";
import { ArrowRight, Check, Circle, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../../auth/AdminAuth";
import useChecklist from "../../hooks/useChecklist";
import { setChecklistItemDone } from "../../services/checklistService";

export default function ChecklistPreview() {
  const { isAdmin } = useAdminAuth();
  const { items, setItems, loading, error } = useChecklist(isAdmin);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const doneCount = items.filter((item) => item.is_done).length;

  async function toggle(item) {
    if (!isAdmin) return;
    const isDone = !item.is_done;
    setBusyId(item.id);
    setActionError("");
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_done: isDone } : entry));
    try {
      await setChecklistItemDone(item.id, isDone);
    } catch (updateError) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_done: item.is_done } : entry));
      setActionError(`La modification n'a pas été enregistrée. ${updateError.message}`);
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="glass-card rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-mint">Avant de partir</p><h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Les petits essentiels</h2><p className="mt-1 text-sm text-slate-400">{doneCount} sur {items.length} prêts</p></div>
        <Link to="/checklist" className="inline-flex items-center gap-1 text-sm font-semibold text-mint hover:text-emerald-200">Ouvrir la checklist <ArrowRight size={15} /></Link>
      </div>
      {(error || actionError) && <p role="status" className="mb-4 rounded-xl border border-amber-200/15 bg-amber-200/[0.04] p-3 text-xs leading-5 text-amber-100">{actionError || error}</p>}
      {!isAdmin ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-7 text-center">
          <ListChecks size={23} className="mx-auto text-mint" />
          <p className="mt-2 text-sm text-slate-300">Connectez-vous pour consulter la checklist partagée.</p>
          <Link to="/admin" className="mt-3 inline-flex text-xs font-semibold text-mint hover:text-emerald-200">Accéder à l'espace privé <ArrowRight size={14} className="ml-1" /></Link>
        </div>
      ) : items.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
            <button type="button" disabled={!isAdmin || busyId === item.id} onClick={() => void toggle(item)} aria-label={`${item.is_done ? "Décocher" : "Cocher"} ${item.title}`} aria-pressed={item.is_done} className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition disabled:cursor-default ${item.is_done ? "border-mint/30 bg-mint/10 text-mint" : "border-white/15 text-slate-500"}`}>
              {item.is_done ? <Check size={15} /> : <Circle size={13} />}
            </button>
            <div><p className={`text-sm font-medium ${item.is_done ? "text-muted line-through" : "text-slate-200"}`}>{item.title}</p>{item.description && <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>}</div>
          </li>)}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-7 text-center">
          <ListChecks size={23} className="mx-auto text-mint" />
          <p className="mt-2 text-sm text-slate-300">{loading ? "Chargement de la checklist…" : "La checklist se prépare."}</p>
          <p className="mt-1 text-xs text-muted">Ajoutez vos indispensables depuis votre espace admin.</p>
        </div>
      )}
    </section>
  );
}
