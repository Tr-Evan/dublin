import { useState } from "react";
import { ImagePlus, LoaderCircle, Send, Trash2 } from "lucide-react";
import { useAdminAuth } from "../../auth/AdminAuth";
import { removeFamilyUpdate } from "../../services/timelineService";
import useFamilyUpdates from "../../hooks/useFamilyUpdates";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import FamilyUpdateComposer from "./FamilyUpdateComposer";
import SectionHeading from "../ui/SectionHeading";
import ImageGallery from "../ui/ImageGallery";

export default function AdminTimeline() {
  const { session } = useAdminAuth();
  const { updates, setUpdates, loading, error, refresh } = useFamilyUpdates();
  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  async function deleteUpdate(update) {
    if (!window.confirm(`Supprimer le souvenir « ${update.title} » ?`)) return;
    setBusy(update.id);
    setActionError("");
    setMessage("");
    try {
      await removeFamilyUpdate(update);
      setUpdates((current) => current.filter((item) => item.id !== update.id));
      await refresh();
      setMessage("Le souvenir a été supprimé du journal.");
    } catch (deleteError) {
      setActionError(`Impossible de supprimer le souvenir. ${deleteError.message}`);
    } finally {
      setBusy("");
    }
  }

  return (
    <section>
      <SectionHeading
        eyebrow="En direct avec la famille"
        title="Le journal de bord"
        description="Racontez vos petites aventures, à deux. Chaque mot et photo est partagé en direct sur /family."
        action={<Button icon={Send} onClick={() => setComposing(true)}>Partager un souvenir</Button>}
      />
      {(actionError || error) && <p role="alert" className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{actionError || error}</p>}
      {message && <p role="status" className="mb-4 rounded-2xl border border-mint/20 bg-mint/[0.06] p-4 text-sm text-mint">{message}</p>}
      {loading && !updates.length && <p className="text-sm text-muted">Chargement du journal…</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {updates.map((update) => (
          <article key={update.id} className="glass-card overflow-hidden rounded-2xl">
            <div className="p-3 pb-0"><ImageGallery images={update.photoUrls ?? (update.photoUrl ? [update.photoUrl] : [])} label={`Souvenir : ${update.title}`} className="h-40" /></div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div><Badge tone="mint">{new Date(`${update.travel_date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {update.travel_time.slice(0, 5)}</Badge><h3 className="mt-2 font-semibold text-white">{update.title}</h3></div>
              <button type="button" disabled={busy === update.id} onClick={() => void deleteUpdate(update)} aria-label={`Supprimer le souvenir ${update.title}`} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:text-rose-200 disabled:opacity-40">{busy === update.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>
            </div>
            {update.description && <p className="px-4 pb-4 text-sm leading-5 text-slate-400">{update.description}</p>}
          </article>
        ))}
        {!loading && !updates.length && <div className="glass-card rounded-2xl p-6 text-sm text-muted md:col-span-2 xl:col-span-3"><ImagePlus size={19} className="mb-3 text-mint" />Pas encore de souvenir. Publiez votre première photo ou un petit mot après votre arrivée.</div>}
      </div>
      {composing && <FamilyUpdateComposer userId={session.user.id} onClose={() => setComposing(false)} onPublished={(update) => { setUpdates((current) => [...current, update].sort((first, second) => first.travel_date.localeCompare(second.travel_date) || first.travel_time.localeCompare(second.travel_time))); setMessage("Le souvenir est en ligne pour votre famille."); void refresh(); }} />}
    </section>
  );
}
