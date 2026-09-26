import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Check, CloudDownload, Eye, FileImage, FileText, LoaderCircle, Plus, Trash2, Upload, X } from "lucide-react";
import { cacheDocumentForOffline, deleteOfflineDocument, deleteTravelDocument, documentSlots, getOfflineDocuments, getTravelDocuments, readTravelDocument, uploadTravelDocument, validateTravelDocument } from "../../services/documentService";
import { supabase } from "../../services/supabaseClient";
import { useAdminAuth } from "../../auth/AdminAuth";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";

function isCached(id, saved) {
  return saved.some((document) => document.id === id);
}

export default function DocumentVault() {
  const { session } = useAdminAuth();
  const [documents, setDocuments] = useState([]);
  const [savedOffline, setSavedOffline] = useState([]);
  const [title, setTitle] = useState("");
  const [freeFile, setFreeFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [offline, setOffline] = useState(false);
  const [preview, setPreview] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setSavedOffline(await getOfflineDocuments());
    } catch (storageError) {
      setError(`Impossible de lire les fichiers enregistrés sur cet appareil : ${storageError.message}`);
      return;
    }
    if (!supabase || navigator.onLine === false) {
      setDocuments([]);
      setOffline(true);
      return;
    }
    try {
      setDocuments(await getTravelDocuments());
      setOffline(false);
    } catch (loadError) {
      setError(`Impossible de charger le coffre-fort. ${loadError.message}`);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleNetworkChange = () => void refresh();
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    if (!supabase) return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
    const channel = supabase.channel("travel-documents")
      .on("postgres_changes", { event: "*", schema: "public", table: "travel_documents" }, () => void refresh())
      .subscribe();
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const displayedDocuments = useMemo(() => {
    const onlineIds = new Set(documents.map((document) => document.id));
    return [...documents, ...savedOffline.filter((document) => !onlineIds.has(document.id))];
  }, [documents, savedOffline]);

  async function upload({ file, documentTitle, slotKey }) {
    if (!file) throw new Error("Choisissez un fichier avant de l'importer.");
    validateTravelDocument(file);
    const saved = await uploadTravelDocument({ file, title: documentTitle, slotKey, userId: session.user.id });
    if (slotKey) {
      const oldOfflineFiles = (await getOfflineDocuments()).filter((document) => document.slotKey === slotKey && document.id !== saved.id);
      for (const oldFile of oldOfflineFiles) await deleteOfflineDocument(oldFile.id);
      setSavedOffline(await getOfflineDocuments());
    }
    setDocuments((current) => [saved, ...current.filter((item) => item.id !== saved.id && item.slot_key !== slotKey)]);
    setFreeFile(null);
    setTitle("");
  }

  async function handleUpload(event, documentTitle, slotKey, busyKey) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.querySelector('input[type="file"]').files?.[0];
    setBusy(busyKey);
    setError("");
    try {
      await upload({ file, documentTitle, slotKey });
      form.reset();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy("");
    }
  }

  async function handleDownload(document) {
    setBusy(document.id);
    setError("");
    try {
      await cacheDocumentForOffline(document);
      setSavedOffline(await getOfflineDocuments());
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setBusy("");
    }
  }

  async function handlePreview(document) {
    setBusy(document.id);
    setError("");
    try {
      const blob = await readTravelDocument(document);
      const url = URL.createObjectURL(blob);
      setPreview({ title: document.title, url, type: document.mime_type ?? document.mimeType });
      setSavedOffline(await getOfflineDocuments());
    } catch (previewError) {
      setError(`Impossible d'ouvrir le document. ${previewError.message}`);
    } finally {
      setBusy("");
    }
  }

  async function handleDelete(document) {
    if (!window.confirm(`Supprimer « ${document.title} » du coffre-fort ?`)) return;
    setBusy(document.id);
    setError("");
    try {
      if (documents.some((item) => item.id === document.id)) await deleteTravelDocument(document);
      else {
        await deleteOfflineDocument(document.id);
      }
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setSavedOffline(await getOfflineDocuments());
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy("");
    }
  }

  function renderDocument(document) {
    const cached = isCached(document.id, savedOffline);
    const Icon = document.mime_type?.startsWith("image/") || document.mimeType?.startsWith("image/") ? FileImage : FileText;
    return (
      <div key={document.id} className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/[0.08] text-mint"><Icon size={19} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{document.title}</p>
          <p className="mt-1 text-xs text-muted">{document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(1)} Mo` : `${(document.blob.size / 1024 / 1024).toFixed(1)} Mo`}</p>
        </div>
        <div className="flex items-center gap-2">
          {cached && <Badge tone="mint" icon={Check}>Disponible hors ligne</Badge>}
          <button type="button" onClick={() => void handleDownload(document)} disabled={busy === document.id} aria-label={cached ? `Télécharger ${document.title}` : `Enregistrer ${document.title} hors ligne`} title={cached ? "Retélécharger" : "Enregistrer et télécharger pour le mode hors ligne"} className="rounded-xl border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/[0.06] hover:text-mint disabled:opacity-50">
            {busy === document.id ? <LoaderCircle size={17} className="animate-spin" /> : <CloudDownload size={17} />}
          </button>
          <button type="button" onClick={() => void handlePreview(document)} disabled={busy === document.id} aria-label={`Ouvrir ${document.title}`} title="Ouvrir le document" className="rounded-xl border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/[0.06] hover:text-mint disabled:opacity-50"><Eye size={17} /></button>
          <button type="button" onClick={() => void handleDelete(document)} disabled={busy === document.id} aria-label={`Supprimer ${document.title}`} className="rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"><Trash2 size={17} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <SectionHeading eyebrow="Privé · réservé aux administrateurs" title="Le coffre-fort" description="Billets, réservations et justificatifs restent privés. Enregistrez les documents importants sur cet appareil avant de partir pour les consulter sans réseau." />
      {offline && <p className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4 text-sm text-amber-100">Hors connexion : seuls les fichiers déjà enregistrés sur cet appareil sont disponibles.</p>}
      {error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{error}</p>}

      <section>
        <div className="mb-4 flex items-center gap-3"><Archive size={19} className="text-mint" /><h2 className="text-lg font-semibold text-white">Billets d'avion</h2></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {documentSlots.map((slot) => {
            const existing = documents.find((document) => document.slot_key === slot.key)
              ?? savedOffline.find((document) => document.slotKey === slot.key);
            return (
              <form key={slot.key} onSubmit={(event) => void handleUpload(event, slot.title, slot.key, slot.key)} className="glass-card rounded-3xl p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">{slot.title}</h3>
                {existing ? renderDocument(existing) : (
                  <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-xs text-muted transition hover:border-mint/40 hover:text-mint">
                    <Upload size={19} />
                    Choisir un billet (PDF ou image)
                    <input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" />
                  </label>
                )}
                {existing
                  ? <label className={`mt-3 block text-xs text-mint hover:text-emerald-200 ${offline ? "pointer-events-none opacity-40" : "cursor-pointer"}`}>Remplacer ce billet<input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={offline} onChange={(event) => { const file = event.target.files?.[0]; if (file) { const form = event.target.form; setBusy(slot.key); void upload({ file, documentTitle: slot.title, slotKey: slot.key }).then(refresh).catch((uploadError) => setError(uploadError.message)).finally(() => setBusy("")); form.reset(); } }} /></label>
                  : <Button type="submit" icon={busy === slot.key ? LoaderCircle : Upload} variant="secondary" className="mt-3 w-full" disabled={busy === slot.key}>{busy === slot.key ? "Importation…" : "Importer le billet"}</Button>}
              </form>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3"><Plus size={19} className="text-mint" /><h2 className="text-lg font-semibold text-white">Upload libre</h2></div>
        <form onSubmit={(event) => void handleUpload(event, title, null, "free")} className="glass-card grid gap-3 rounded-3xl p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-medium text-slate-300">Nom du document<input required maxLength={120} value={title} disabled={offline} onChange={(event) => setTitle(event.target.value)} placeholder="Réservation Trinity College" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none focus:border-mint/40" /></label>
          <label className="text-xs font-medium text-slate-300">Fichier (PDF, JPEG, PNG, WebP)<input required type="file" disabled={offline} accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFreeFile(event.target.files?.[0] ?? null)} className="mt-2 block min-h-11 w-full text-xs text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white" /></label>
          <Button type="submit" icon={busy === "free" ? LoaderCircle : Upload} disabled={offline || busy === "free" || !freeFile}>{busy === "free" ? "Importation…" : "Importer"}</Button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white">Documents du voyage</h2><Badge tone="mint">{displayedDocuments.length} fichier{displayedDocuments.length === 1 ? "" : "s"}</Badge></div>
        {displayedDocuments.length
          ? <div className="space-y-3">{displayedDocuments.map(renderDocument)}</div>
          : <div className="glass-card rounded-3xl p-8 text-center text-sm text-muted">Aucun document pour le moment. Ajoutez vos billets et réservations ci-dessus.</div>}
      </section>
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={preview.title} onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}>
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-panel" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] p-4"><h2 className="truncate font-semibold text-white">{preview.title}</h2><button type="button" aria-label="Fermer l'aperçu" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:text-white"><X size={18} /></button></div>
            {preview.type === "application/pdf"
              ? <iframe title={preview.title} src={preview.url} className="min-h-0 flex-1 bg-white" />
              : <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"><img src={preview.url} alt={preview.title} className="max-h-full max-w-full rounded-xl object-contain" /></div>}
          </div>
        </div>
      )}
    </div>
  );
}
