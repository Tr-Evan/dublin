import { useEffect, useState } from "react";
import { ImagePlus, Save, X } from "lucide-react";
import Button from "../ui/Button";

const blankPlace = {
  name: "",
  category: "",
  description: "",
  address: "",
  openingHours: "",
  price: "",
  distance: "",
  mapQuery: "",
  note: "",
  accent: "mint",
  details: [],
};

const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none transition placeholder:text-muted/70 focus:border-mint/40";

export default function PlaceEditorForm({ place, kind, onSave, onCancel }) {
  const [values, setValues] = useState(blankPlace);
  const [images, setImages] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(place ? { ...blankPlace, ...place } : blankPlace);
    setImages([]);
    setError("");
  }, [place, kind]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function selectImages(fileList) {
    const selected = Array.from(fileList ?? []);
    if (selected.length > 8) {
      setError("Import limité à 8 photos.");
      return;
    }
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setError("Choisissez uniquement des photos JPEG, PNG ou WebP.");
      return;
    }
    setError("");
    setImages(selected);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(values, images);
      if (!place) setValues(blankPlace);
      setImages([]);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-card space-y-5 rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">{place ? "Modifier l'adresse" : "Ajouter une adresse"}</h3>
        {place && <Button type="button" variant="secondary" icon={X} onClick={onCancel} aria-label="Annuler la modification" className="min-h-10 px-3" />}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-300">Nom du lieu<input className={inputClass} maxLength={120} required value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="Ex. Trinity College" /></label>
        <label className="text-xs font-medium text-slate-300">Catégorie<input className={inputClass} required value={values.category} onChange={(event) => update("category", event.target.value)} placeholder="Ex. Histoire & culture" /></label>
        <label className="text-xs font-medium text-slate-300 sm:col-span-2">Description<textarea className={`${inputClass} min-h-24 py-3`} maxLength={1200} value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Qu'est-ce qui rend cette adresse spéciale ?" /></label>
        <label className="text-xs font-medium text-slate-300 sm:col-span-2">Adresse<input className={inputClass} value={values.address} onChange={(event) => update("address", event.target.value)} placeholder="Adresse à Dublin" /></label>
        <label className="text-xs font-medium text-slate-300">Horaires d'ouverture<input className={inputClass} value={values.openingHours} onChange={(event) => update("openingHours", event.target.value)} placeholder="Ex. 9 h — 17 h" /></label>
        <label className="text-xs font-medium text-slate-300">Prix<input className={inputClass} value={values.price} onChange={(event) => update("price", event.target.value)} placeholder="Ex. ≈ 19 € / personne" /></label>
        <label className="text-xs font-medium text-slate-300">Temps de trajet<input className={inputClass} value={values.distance} onChange={(event) => update("distance", event.target.value)} placeholder="Ex. 12 min · 850 m" /></label>
        <label className="text-xs font-medium text-slate-300">Recherche Google Maps<input className={inputClass} value={values.mapQuery} onChange={(event) => update("mapQuery", event.target.value)} placeholder={values.name || "Nom du lieu"} /></label>
        <label className="text-xs font-medium text-slate-300 sm:col-span-2">À savoir<textarea className={`${inputClass} min-h-20 py-3`} maxLength={500} value={values.note} onChange={(event) => update("note", event.target.value)} placeholder="Conseil ou information utile" /></label>
      </div>
      <label
        className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-center text-sm transition ${dragging ? "border-mint bg-mint/[0.08] text-mint" : "border-white/15 bg-white/[0.02] text-slate-300 hover:border-mint/40"}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); selectImages(event.dataTransfer.files); }}
      >
        <ImagePlus size={22} className="text-mint" />
        <span>{images.length ? `${images.length} nouvelle${images.length === 1 ? "" : "s"} photo${images.length === 1 ? "" : "s"} sélectionnée${images.length === 1 ? "" : "s"}` : "Déposer des photos ou appuyer pour choisir"}</span>
        <span className="text-xs text-muted">{values.imageUrls?.length ? "Choisir de nouvelles photos remplace la galerie actuelle" : "Jusqu'à 8 photos · JPEG, PNG ou WebP · 8 Mo max chacune"}</span>
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => selectImages(event.target.files)} />
      </label>
      {values.imageUrls?.length > 0 && !images.length && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{values.imageUrls.map((url) => <img key={url} src={url} alt={`Photo de ${values.name}`} loading="lazy" className="h-24 w-full rounded-xl object-cover" />)}</div>}
      {error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200">{error}</p>}
      <Button type="submit" icon={Save} disabled={saving}>{saving ? "Enregistrement…" : place ? "Enregistrer les modifications" : "Ajouter l'adresse"}</Button>
    </form>
  );
}
