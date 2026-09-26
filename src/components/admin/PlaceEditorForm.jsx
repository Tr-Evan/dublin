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
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(place ? { ...blankPlace, ...place } : blankPlace);
    setImage(null);
    setError("");
  }, [place, kind]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(values, image);
      if (!place) setValues(blankPlace);
      setImage(null);
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
        {place && <button type="button" onClick={onCancel} className="rounded-xl p-2 text-muted transition hover:bg-white/[0.06] hover:text-white" aria-label="Annuler la modification"><X size={18} /></button>}
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
      <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 text-sm text-slate-300 transition hover:border-mint/40">
        <ImagePlus size={20} className="text-mint" />
        <span className="min-w-0 flex-1 truncate">{image?.name ?? (values.imageUrl ? "Remplacer la photo de couverture" : "Ajouter une photo de couverture")}</span>
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
      </label>
      {values.imageUrl && !image && <img src={values.imageUrl} alt={`Couverture de ${values.name}`} className="h-36 w-full rounded-2xl object-cover" />}
      {error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200">{error}</p>}
      <Button type="submit" icon={Save} disabled={saving}>{saving ? "Enregistrement…" : place ? "Enregistrer les modifications" : "Ajouter l'adresse"}</Button>
    </form>
  );
}
