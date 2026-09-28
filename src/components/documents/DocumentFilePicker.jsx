import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { validateTravelDocument } from "../../services/documentService";

export default function DocumentFilePicker({ selectedFile, onFile, disabled = false, compact = false }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return undefined;
    const timeout = window.setTimeout(() => setError(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  function acceptFile(file) {
    if (!file) return;
    try {
      validateTravelDocument(file);
      setError("");
      onFile(file);
    } catch (validationError) {
      console.error("Document refusé à la sélection", {
        name: file.name,
        type: file.type || "(MIME vide, fréquent sur mobile)",
        size: file.size,
        error: validationError.message,
      });
      setError("Format non supporté ou fichier trop lourd. Formats acceptés : PDF, JPEG, PNG ou WebP (15 Mo max).");
      onFile(null);
    }
  }

  return (
    <div>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-center transition ${compact ? "min-h-16 px-3 py-2" : "min-h-28 p-4"} ${dragging ? "border-mint bg-mint/[0.08]" : "border-white/20 bg-white/[0.025] hover:border-mint/45"} ${disabled ? "pointer-events-none opacity-50" : ""}`}
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) acceptFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <Upload size={compact ? 16 : 20} className="text-mint" />
        <span className="max-w-full truncate text-xs font-medium text-slate-200">{selectedFile?.name ?? "Déposez un fichier ici ou appuyez pour le choisir"}</span>
        {!compact && <span className="text-[11px] text-muted">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} Mo` : "PDF, JPEG, PNG ou WebP · 15 Mo max"}</span>}
        <input
          className="sr-only"
          type="file"
          disabled={disabled}
          accept="image/*,.pdf,application/pdf"
          onChange={(event) => {
            acceptFile(event.currentTarget.files?.item(0) ?? null);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {error && <p role="alert" className="fixed bottom-24 right-4 z-[80] max-w-sm rounded-2xl border border-rose-400/25 bg-rose-950/95 p-4 text-sm text-rose-100 shadow-2xl md:bottom-6">{error}</p>}
    </div>
  );
}
