import { useState } from "react";
import { ArrowUpRight, Bus, Clock3, ExternalLink, Footprints, MapPin, Navigation, TramFront, ChevronDown } from "lucide-react";
import Badge from "./Badge";
import Button from "./Button";
import ImageGallery from "./ImageGallery";

const toneFor = (accent) => ({ mint: "mint", amber: "amber", rose: "rose" }[accent] ?? "mint");

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export default function PlaceCard({ place }) {
  const [expanded, setExpanded] = useState(false);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent("Riu Plaza The Gresham Dublin")}&destination=${encodeURIComponent(place.mapQuery ?? place.name)}`;
  const tone = toneFor(place.accent);
  const transportMode = place.transportDetails?.mode?.toLocaleLowerCase("fr");
  const TransportIcon = transportMode?.includes("bus")
    ? Bus
    : transportMode?.includes("luas")
      ? TramFront
      : Footprints;
  const transportModeLabel = transportMode === "marche" ? "À pied" : place.transportDetails?.mode;
  const bookingLink = safeExternalUrl(place.bookingLink);
  const officialWebsite = safeExternalUrl(place.officialWebsite);

  return (
    <article className="glass-card flex h-full flex-col rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-mint/20 sm:p-6">
      <div className="mb-4"><ImageGallery images={place.imageUrls ?? (place.imageUrl ? [place.imageUrl] : [])} label={place.name} className="h-40" /></div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <Badge tone={tone}>{place.category}</Badge>
        <span className="text-right text-xs text-muted">{place.distance}</span>
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-white">{place.name}</h3>
      {place.priceRange && <p className="mt-2 inline-flex w-fit max-w-full rounded-full border border-emerald-300/30 bg-emerald-300 px-3 py-1.5 text-xs font-semibold leading-4 text-emerald-950">{place.priceRange}</p>}
      <p className="mt-2 text-sm leading-6 text-slate-400">{place.description}</p>

      {place.transportDetails && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
          <TransportIcon size={17} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200">
              {transportModeLabel}
              {place.transportDetails.duration != null && ` · ${place.transportDetails.duration} min`}
            </p>
            {place.transportDetails.route && <p className="mt-1 text-xs leading-5 text-slate-400">{place.transportDetails.route}</p>}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3 border-y border-white/[0.07] py-4">
        <p className="flex items-start gap-2 text-sm text-slate-300"><MapPin size={16} className="mt-0.5 shrink-0 text-mint" />{place.address}</p>
        <p className="flex items-start gap-2 text-sm font-medium text-white"><Clock3 size={16} className="mt-0.5 shrink-0 text-mint" />{place.openingHours}</p>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{place.price}</Badge>
          {place.travel && <Badge tone="neutral">{place.travel}</Badge>}
        </div>
      </div>

      {place.note && <p className="mt-4 rounded-2xl bg-white/[0.035] px-4 py-3 text-xs leading-5 text-slate-400">{place.note}</p>}

      {place.details?.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-200 transition hover:text-mint"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {place.detailsLabel ?? "Voir les détails"}
            <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {expanded && (
            <ul className="mt-2 space-y-3 border-t border-white/[0.07] pt-3">
              {place.details.map((detail) => (
                <li key={detail.title} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-200">{detail.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{detail.description}</p>
                  </div>
                  {detail.price && <span className="shrink-0 text-xs font-semibold text-mint">{detail.price}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        <Button href={mapsUrl} icon={Navigation} target="_blank" rel="noopener noreferrer" className="w-full">Y aller</Button>
        {(bookingLink || officialWebsite) && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {bookingLink && <Button href={bookingLink} icon={ExternalLink} variant="secondary" target="_blank" rel="noopener noreferrer" className="w-full">Réserver</Button>}
            {officialWebsite && <Button href={officialWebsite} icon={ArrowUpRight} variant="secondary" target="_blank" rel="noopener noreferrer" className="w-full">Site officiel</Button>}
          </div>
        )}
      </div>
    </article>
  );
}
