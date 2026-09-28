import { X } from "lucide-react";

export default function DocumentPreview({ preview, onClose }) {
  if (!preview) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={preview.title} onClick={onClose}>
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-panel" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] p-4">
          <h2 className="truncate font-semibold text-white">{preview.title}</h2>
          <button type="button" aria-label="Fermer l'aperçu" onClick={onClose} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"><img src={preview.url} alt={preview.title} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" /></div>
      </div>
    </div>
  );
}
