import { useState } from "react";
import { Archive, FileLock2, LoaderCircle, Plus, Upload } from "lucide-react";
import { useAdminAuth } from "../../auth/AdminAuth";
import { cacheDocumentForOffline, deleteOfflineDocument, deleteTravelDocument, documentSlots, getOfflineDocuments, saveTravelDocumentOffline, uploadTravelDocument } from "../../services/documentService";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";
import DocumentFilePicker from "./DocumentFilePicker";
import DocumentPreview from "./DocumentPreview";
import VaultDocumentList from "./VaultDocumentList";
import useVaultDocuments from "./useVaultDocuments";

export default function VaultManager() {
  const { session } = useAdminAuth();
  const vault = useVaultDocuments();
  const [title, setTitle] = useState("");
  const [freeFile, setFreeFile] = useState(null);
  const [slotFiles, setSlotFiles] = useState({});
  const [saving, setSaving] = useState("");

  async function upload(file, documentTitle, slotKey, busyKey) {
    if (!session?.user?.id) {
      vault.setError("La session administrateur a expiré. Reconnectez-vous avant d'importer un document.");
      return;
    }
    if (vault.offline) {
      vault.setError("Reconnectez-vous pour importer ou remplacer un document.");
      return;
    }
    vault.setError("");
    setSaving(busyKey);
    try {
      const saved = await uploadTravelDocument({ file, title: documentTitle, slotKey, userId: session.user.id });
      if (slotKey) {
        const oldOfflineFiles = (await getOfflineDocuments()).filter((document) => document.slotKey === slotKey && document.id !== saved.id);
        for (const oldFile of oldOfflineFiles) await deleteOfflineDocument(oldFile.id);
      }
      if (slotKey) {
        try {
          const { persistent } = await saveTravelDocumentOffline(saved, saved.compressedFile);
          vault.setOfflineWarning(persistent ? "" : "Document importé, mais le navigateur ne garantit pas sa conservation hors ligne après un nettoyage du stockage.");
        } catch (offlineError) {
          vault.setError(`Document importé, mais sa copie hors ligne n'a pas pu être enregistrée : ${offlineError.message}`);
        }
      }
      await vault.refresh();
      if (slotKey) setSlotFiles((current) => ({ ...current, [slotKey]: null }));
      else {
        setFreeFile(null);
        setTitle("");
      }
    } catch (uploadError) {
      vault.setError(`Impossible d'importer le document. ${uploadError.message}`);
    } finally {
      setSaving("");
    }
  }

  async function handleDownload(document) {
    vault.setBusy(document.id);
    vault.setError("");
    vault.setOfflineWarning("");
    try {
      const persistent = await cacheDocumentForOffline(document);
      await vault.refresh();
      if (!persistent) vault.setOfflineWarning("Le document est enregistré hors ligne, mais le navigateur ne garantit pas sa conservation après un nettoyage du stockage.");
    } catch (downloadError) {
      vault.setError(downloadError.message);
    } finally {
      vault.setBusy("");
    }
  }

  async function handleDelete(document) {
    if (!window.confirm(`Supprimer « ${document.title} » du coffre-fort ?`)) return;
    vault.setBusy(document.id);
    vault.setError("");
    try {
      if (vault.documents.some((item) => item.id === document.id)) await deleteTravelDocument(document);
      else await deleteOfflineDocument(document.id);
      await vault.refresh();
    } catch (deleteError) {
      vault.setError(`Impossible de supprimer le document. ${deleteError.message}`);
    } finally {
      vault.setBusy("");
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="Administration · privé" title="Gestion du coffre-fort" description="Ajoutez, remplacez ou supprimez les images des billets et documents privés du voyage." />
      <p className="rounded-2xl border border-mint/15 bg-mint/[0.04] p-4 text-sm leading-6 text-slate-300">Images JPEG, PNG ou WebP uniquement · 25 Mo maximum par image. Elles sont compressées avant l'envoi (300 Ko max). Astuce : faites une capture d'écran de vos billets PDF.</p>
      {vault.offline && <p role="status" className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4 text-sm text-amber-100">Hors connexion : les documents enregistrés sur cet appareil restent consultables, mais les imports et suppressions sont désactivés.</p>}
      {vault.offlineWarning && <p role="status" className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4 text-sm text-amber-100">{vault.offlineWarning}</p>}
      {vault.error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{vault.error}</p>}

      <section>
        <div className="mb-4 flex items-center gap-3"><Archive size={19} className="text-mint" /><h2 className="text-lg font-semibold text-white">Billets d'avion</h2></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {documentSlots.map((slot) => {
            const existing = vault.documents.find((document) => document.slot_key === slot.key)
              ?? vault.savedOffline.find((document) => document.slotKey === slot.key);
            const selectedFile = slotFiles[slot.key] ?? null;
            return (
              <div key={slot.key} className="glass-card space-y-3 rounded-3xl p-4">
                <h3 className="text-sm font-semibold text-white">{slot.title}</h3>
                {existing && <p className="truncate rounded-xl border border-mint/15 bg-mint/[0.04] px-3 py-2 text-xs text-mint">Document actuel : {existing.title}</p>}
                <DocumentFilePicker selectedFile={selectedFile} disabled={vault.offline || saving === slot.key} onFile={(file) => setSlotFiles((current) => ({ ...current, [slot.key]: file }))} />
                <Button type="button" icon={saving === slot.key ? LoaderCircle : Upload} variant="secondary" className="w-full" disabled={vault.offline || saving === slot.key || !selectedFile} onClick={() => void upload(selectedFile, slot.title, slot.key, slot.key)}>
                  {saving === slot.key ? "Importation…" : existing ? "Remplacer le billet" : "Importer le billet"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3"><Plus size={19} className="text-mint" /><h2 className="text-lg font-semibold text-white">Autres documents</h2></div>
        <form onSubmit={(event) => { event.preventDefault(); void upload(freeFile, title, null, "free"); }} className="glass-card grid gap-3 rounded-3xl p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-medium text-slate-300">Nom du document<input required maxLength={120} value={title} disabled={vault.offline} onChange={(event) => setTitle(event.target.value)} placeholder="Réservation Trinity College" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-ink/80 px-3 text-sm text-white outline-none focus:border-mint/40" /></label>
          <DocumentFilePicker selectedFile={freeFile} disabled={vault.offline || saving === "free"} onFile={setFreeFile} />
          <Button type="submit" icon={saving === "free" ? LoaderCircle : Upload} disabled={vault.offline || saving === "free" || !freeFile}>{saving === "free" ? "Importation…" : "Importer"}</Button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FileLock2 size={18} className="text-mint" /><h2 className="text-lg font-semibold text-white">Tous les documents du voyage</h2></div><Badge tone="mint">{vault.displayedDocuments.length} fichier{vault.displayedDocuments.length === 1 ? "" : "s"}</Badge></div>
        {vault.displayedDocuments.length
          ? <VaultDocumentList documents={vault.displayedDocuments} savedOffline={vault.savedOffline} busy={vault.busy} onDownload={handleDownload} onPreview={vault.handlePreview} onDelete={handleDelete} />
          : <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted">Aucun document enregistré pour le moment.</div>}
      </section>
      <DocumentPreview preview={vault.preview} onClose={vault.closePreview} />
    </div>
  );
}
