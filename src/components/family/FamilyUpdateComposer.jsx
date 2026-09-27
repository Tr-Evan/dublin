import { useState } from "react";
import { CalendarDays, ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import { publishFamilyUpdate } from "../../services/timelineService";
import Button from "../ui/Button";

const tripDates = [20, 21, 22, 23].map((day) => `2026-10-${day}`);
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none transition placeholder:text-muted/70 focus:border-mint/40";

export default function FamilyUpdateComposer({ userId, onClose, onPublished }) {
  const [date, setDate] = useState(tripDates[0]);
  const [time, setTime] = useState(new Intl.DateTimeFormat("fr-CA", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin", hourCycle: "h23" }).format(new Date()));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const update = await publishFamilyUpdate({ travelDate: date, travelTime: time, title, description, photos, userId });
      onPublished(update);
      onClose();
    } catch (publishError) {
      setError(publishError.message);
    } finally {
      setBusy(false);
    }
  }

  function setPhotoFiles(files) {
    setError("");
    const selected = Array.from(files ?? []);
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setError("Choisissez uniquement des photos JPEG, PNG ou WebP.");
      return;
    }
    if (selected.length > 8) {
      setError("Sélection limitée à 8 photos.");
      return;
    }
    setPhotos(selected);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="family-update-title" onClick={() => { if (!busy) onClose(); }}>
      <section className="glass-card modal-scroll flex max-h-[100dvh] w-full max-w-xl flex-col overflow-y-auto rounded-t-3xl p-5 sm:max-h-[90dvh] sm:rounded-3xl sm:p-7" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">Un petit mot de Dublin</p><h2 id="family-update-title" className="mt-2 text-xl font-semibold text-white">Partager un souvenir</h2><p className="mt-1 text-sm text-muted">En direct sur la timeline de la famille.</p></div>
          <Button type="button" variant="secondary" icon={X} disabled={busy} onClick={onClose} aria-label="Fermer le formulaire" className="min-h-10 px-3" />
        </div>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-300">Jour<select required value={date} onChange={(event) => setDate(event.target.value)} className={inputClass}>{tripDates.map((day) => <option key={day} value={day}>{new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-300">Heure à Dublin<input type="time" required value={time} onChange={(event) => setTime(event.target.value)} className={inputClass} /></label>
          </div>
          <label className="block text-xs font-medium text-slate-300">Titre<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Découverte de Trinity College" className={inputClass} /></label>
          <label className="block text-xs font-medium text-slate-300">Message <span className="text-muted">(facultatif)</span><textarea maxLength={1200} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Quelques mots pour la famille…" className={`${inputClass} resize-y py-3`} /></label>
          <label
            className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-5 text-center transition ${dragging ? "border-mint bg-mint/[0.08]" : "border-white/20 bg-white/[0.025] hover:border-mint/45"} ${photos.length ? "text-mint" : "text-slate-300"}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); setPhotoFiles(event.dataTransfer.files); }}
          >
            <ImagePlus size={22} className="text-mint" />
            <span className="text-sm font-medium">{photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"} sélectionnée${photos.length === 1 ? "" : "s"}` : "Déposer des photos ou appuyer pour choisir"}</span>
            <span className="text-xs text-muted">{photos.length ? photos.map((photo) => photo.name).join(" · ") : "Jusqu'à 8 photos · Optimisées avant partage"}</span>
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setPhotoFiles(event.target.files)} />
          </label>
          {!photos.length && <p className="flex items-center gap-2 text-xs text-muted"><CalendarDays size={14} className="text-mint" />Les photos sont facultatives : le souvenir peut aussi être publié sans image.</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-white/[0.07] pt-4">
            <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Annuler</Button>
            <Button type="submit" icon={busy ? LoaderCircle : Send} disabled={busy}>{busy ? "Publication…" : "Publier pour la famille"}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
