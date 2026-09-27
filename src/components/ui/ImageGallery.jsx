import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

function Lightbox({ images, initialIndex, onClose, label }) {
  const [index, setIndex] = useState(initialIndex);
  const hasMultiple = images.length > 1;
  const previous = () => setIndex((current) => (current - 1 + images.length) % images.length);
  const next = () => setIndex((current) => (current + 1) % images.length);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasMultiple) previous();
      if (event.key === "ArrowRight" && hasMultiple) next();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasMultiple, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={`Galerie photo : ${label}`} onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="Fermer la galerie" className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/50 p-3 text-white hover:bg-white/15"><X size={22} /></button>
      {hasMultiple && <button type="button" onClick={(event) => { event.stopPropagation(); previous(); }} aria-label="Photo précédente" className="absolute left-3 z-10 rounded-full border border-white/15 bg-black/50 p-3 text-white hover:bg-white/15 sm:left-6"><ChevronLeft size={24} /></button>}
      <figure className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
        <img src={images[index]} alt={`${label} · photo ${index + 1} sur ${images.length}`} loading="lazy" className="max-h-[78dvh] max-w-[90vw] rounded-xl object-cover shadow-2xl" />
        <figcaption className="text-sm text-slate-300">{label} · {index + 1} / {images.length}</figcaption>
      </figure>
      {hasMultiple && <button type="button" onClick={(event) => { event.stopPropagation(); next(); }} aria-label="Photo suivante" className="absolute right-3 z-10 rounded-full border border-white/15 bg-black/50 p-3 text-white hover:bg-white/15 sm:right-6"><ChevronRight size={24} /></button>}
    </div>,
    document.body,
  );
}

export default function ImageGallery({ images = [], label = "Souvenir", className = "h-40" }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const validImages = images.filter(Boolean);
  if (!validImages.length) return null;

  return (
    <>
      <div className={`grid grid-cols-2 gap-2 ${validImages.length === 1 ? "grid-cols-1" : ""}`}>
        {validImages.slice(0, 4).map((image, index) => (
          <button key={`${image}-${index}`} type="button" onClick={() => setLightboxIndex(index)} aria-label={`Agrandir la photo ${index + 1} : ${label}`} className={`group relative overflow-hidden rounded-2xl bg-black/20 ${className} ${validImages.length === 3 && index === 0 ? "row-span-2 h-full" : ""}`}>
            <img src={image} alt={`${label} · photo ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            {index === 3 && validImages.length > 4 && <span className="absolute inset-0 grid place-items-center bg-black/60 text-lg font-semibold text-white">+{validImages.length - 4}</span>}
          </button>
        ))}
      </div>
      {lightboxIndex !== null && <Lightbox images={validImages} initialIndex={lightboxIndex} label={label} onClose={() => setLightboxIndex(null)} />}
    </>
  );
}
