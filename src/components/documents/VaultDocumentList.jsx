import { Check, CloudDownload, Eye, FileImage, FileText, LoaderCircle, Trash2 } from "lucide-react";
import Badge from "../ui/Badge";

function isCached(id, savedOffline) {
  return savedOffline.some((document) => document.id === id);
}

export default function VaultDocumentList({ documents, savedOffline, busy, onDownload, onPreview, onDelete }) {
  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const cached = isCached(document.id, savedOffline);
        const mimeType = document.mime_type ?? document.mimeType;
        const Icon = mimeType?.startsWith("image/") ? FileImage : FileText;
        const fileSize = document.file_size ?? document.fileSize ?? document.blob?.size;
        return (
          <div key={document.id} className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/[0.08] text-mint"><Icon size={19} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{document.title}</p>
              <p className="mt-1 text-xs text-muted">{fileSize ? `${(fileSize / 1024 / 1024).toFixed(1)} Mo` : "Taille inconnue"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {cached && <Badge tone="mint" icon={Check}>Disponible hors ligne</Badge>}
              {onDownload && <button type="button" onClick={() => void onDownload(document)} disabled={busy === document.id} aria-label={cached ? `Télécharger ${document.title}` : `Enregistrer ${document.title} hors ligne`} title={cached ? "Retélécharger" : "Enregistrer et télécharger pour le mode hors ligne"} className="rounded-xl border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/[0.06] hover:text-mint disabled:opacity-50">
                {busy === document.id ? <LoaderCircle size={17} className="animate-spin" /> : <CloudDownload size={17} />}
              </button>}
              {onPreview && <button type="button" onClick={() => void onPreview(document)} disabled={busy === document.id} aria-label={`Ouvrir ${document.title}`} title="Ouvrir le document" className="rounded-xl border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/[0.06] hover:text-mint disabled:opacity-50"><Eye size={17} /></button>}
              {onDelete && <button type="button" onClick={() => void onDelete(document)} disabled={busy === document.id} aria-label={`Supprimer ${document.title}`} title="Supprimer du coffre-fort" className="rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"><Trash2 size={17} /></button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
