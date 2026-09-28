import { useEffect, useState } from "react";
import { Check, CloudDownload, Eye, FileImage, LoaderCircle, Trash2 } from "lucide-react";
import { getTravelDocumentImageUrl } from "../../services/documentService";
import Badge from "../ui/Badge";

function isCached(id, savedOffline) {
  return savedOffline.some((document) => document.id === id);
}

function DocumentThumbnail({ document }) {
  const [source, setSource] = useState("");
  const [loadError, setLoadError] = useState("");
  const mimeType = document.mime_type ?? document.mimeType;

  useEffect(() => {
    let disposed = false;
    let revoke = false;
    let url = "";
    setSource("");
    setLoadError("");
    if (!mimeType?.startsWith("image/")) return undefined;

    getTravelDocumentImageUrl(document)
      .then((result) => {
        if (disposed) {
          if (result.revoke) URL.revokeObjectURL(result.url);
          return;
        }
        url = result.url;
        revoke = result.revoke;
        setSource(url);
      })
      .catch((error) => {
        if (!disposed) setLoadError(error.message);
      });

    return () => {
      disposed = true;
      if (revoke && url) URL.revokeObjectURL(url);
    };
  }, [document, mimeType]);

  if (!mimeType?.startsWith("image/")) {
    return <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-amber-200/15 bg-amber-200/[0.04] px-2 text-center text-[10px] leading-4 text-amber-100">Ancien PDF<br />à remplacer</span>;
  }
  if (loadError) {
    return <span role="img" aria-label={`Aperçu indisponible : ${loadError}`} className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-white/10 bg-ink/70"><FileImage size={20} className="text-slate-500" /></span>;
  }
  return source
    ? <img src={source} alt={`Aperçu de ${document.title}`} className="h-16 w-16 shrink-0 rounded-xl border border-white/10 bg-ink/70 object-cover shadow-lg" />
    : <span aria-hidden="true" className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-white/[0.06]" />;
}

export default function VaultDocumentList({ documents, savedOffline, busy, onDownload, onPreview, onDelete }) {
  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const cached = isCached(document.id, savedOffline);
        const mimeType = document.mime_type ?? document.mimeType;
        const fileSize = document.file_size ?? document.fileSize ?? document.blob?.size;
        return (
          <div key={document.id} className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center">
            <DocumentThumbnail document={document} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{document.title}</p>
              <p className="mt-1 text-xs text-muted">{fileSize ? `${(fileSize / 1024 / 1024).toFixed(1)} Mo` : "Taille inconnue"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {cached && <Badge tone="mint" icon={Check}>Disponible hors ligne</Badge>}
              {onDownload && <button type="button" onClick={() => void onDownload(document)} disabled={busy === document.id} aria-label={cached ? `Télécharger ${document.title}` : `Enregistrer ${document.title} hors ligne`} title={cached ? "Retélécharger" : "Enregistrer et télécharger pour le mode hors ligne"} className="rounded-xl border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/[0.06] hover:text-mint disabled:opacity-50">
                {busy === document.id ? <LoaderCircle size={17} className="animate-spin" /> : <CloudDownload size={17} />}
              </button>}
              {onPreview && mimeType?.startsWith("image/") && <button type="button" onClick={() => void onPreview(document)} disabled={busy === document.id} aria-label={`Ouvrir ${document.title}`} title="Ouvrir l'image" className="rounded-xl border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/[0.06] hover:text-mint disabled:opacity-50"><Eye size={17} /></button>}
              {onDelete && <button type="button" onClick={() => void onDelete(document)} disabled={busy === document.id} aria-label={`Supprimer ${document.title}`} title="Supprimer du coffre-fort" className="rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"><Trash2 size={17} /></button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
