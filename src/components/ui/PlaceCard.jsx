import { useState } from "react";
import { ArrowUpRight, Clock3, MapPin, Navigation, ChevronDown } from "lucide-react";
import Badge from "./Badge";
import Button from "./Button";

const toneFor = (accent) => ({ mint: "mint", amber: "amber", rose: "rose" }[accent] ?? "mint");

export default function PlaceCard({ place }) {
  const [expanded, setExpanded] = useState(false);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent("Riu Plaza The Gresham Dublin")}&destination=${encodeURIComponent(place.mapQuery ?? place.name)}`;
  const tone = toneFor(place.accent);

  return (
    <article className="glass-card flex h-full flex-col rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-mint/20 sm:p-6">
      {place.imageUrl && <img src={place.imageUrl} alt="" loading="lazy" className="mb-4 h-40 w-full rounded-2xl object-cover" />}
      <div className="mb-4 flex items-start justify-between gap-3">
        <Badge tone={tone}>{place.category}</Badge>
        <span className="text-xs text-muted">{place.distance}</span>
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-white">{place.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{place.description}</p>

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
        <Button href={mapsUrl} icon={Navigation} target="_blank" rel="noreferrer" className="w-full">
          Y aller
        </Button>
      </div>
    </article>
  );
}
