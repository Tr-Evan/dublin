import { CalendarDays, MapPin } from "lucide-react";
import { trip } from "../../data/itineraryData";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">
        <a href="/" className="flex items-center gap-3" aria-label="Dublin, accueil">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-mint/20 bg-mint/10 text-lg">☘</span>
          <span>
            <span className="block text-sm font-semibold text-white">Dublin, entre frère & sœurs</span>
            <span className="hidden text-xs text-muted sm:block">Enola & Evan · carnet de voyage</span>
          </span>
        </a>
        <div className="hidden items-center gap-5 text-xs font-medium text-slate-300 sm:flex">
          <span className="flex items-center gap-2"><CalendarDays size={15} className="text-mint" />{trip.datesLabel}</span>
          <span className="flex items-center gap-2"><MapPin size={15} className="text-mint" />Dublin, Irlande</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-mint/15 bg-mint/[0.06] px-3 py-1.5 text-xs font-medium text-mint sm:hidden">
          <MapPin size={13} /> Dublin
        </span>
      </div>
    </header>
  );
}
