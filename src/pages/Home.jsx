import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plane, Sparkles, Umbrella } from "lucide-react";
import { Link } from "react-router-dom";
import { trip } from "../data/itineraryData";
import dublinSkyline from "../assets/dublin-skyline.svg";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import SectionHeading from "../components/ui/SectionHeading";
import WeatherWidget from "../components/weather/WeatherWidget";

function useCountdown(targetDate) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = Math.max(0, new Date(targetDate).getTime() - now);
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    started: remaining === 0 && now < new Date(trip.endDate).getTime(),
    ended: now >= new Date(trip.endDate).getTime(),
  };
}

function FlightCard({ label, time, date, detail, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/[0.09] text-mint"><Icon size={19} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label} · {date}</p>
        <p className="mt-0.5 text-lg font-semibold text-white">{time}</p>
      </div>
      <span className="max-w-24 text-right text-xs leading-5 text-slate-400">{detail}</span>
    </div>
  );
}

export default function Home() {
  const countdown = useCountdown(trip.startDate);
  const countdownLabel = countdown.ended ? "Le séjour est terminé" : countdown.started ? "Profitez bien de Dublin !" : "avant le départ";

  return (
    <div className="space-y-12">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="hero-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-12">
        <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-mint/[0.09] blur-3xl" />
        <img src={dublinSkyline} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 z-0 w-[min(78%,540px)] opacity-[0.13] sm:w-[55%]" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <Badge tone="mint" icon={Sparkles}>{trip.datesLabel}</Badge>
            <p className="mt-7 text-sm font-medium uppercase tracking-[0.24em] text-mint">L'Irlande nous appelle</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Dublin,<br /><span className="text-mint">avec la fratrie Troget.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
              Quatre jours de belles histoires, de bons petits plats et de musique au coin du feu. Votre petite boussole pour profiter de Dublin.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/visites" icon={ArrowRight}>Explorer le carnet</Button>
              <Link to="/food" className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/[0.07]">Nos bonnes adresses</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-ink/50 p-5 shadow-glow backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-muted">Le grand départ</p>
                <p className="mt-2 text-sm text-slate-300">{countdownLabel}</p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint/[0.1] text-mint"><Plane size={20} /></span>
            </div>
            {!countdown.ended && !countdown.started && (
              <div className="my-5 grid grid-cols-3 gap-2">
                {[["Jours", countdown.days], ["Heures", countdown.hours], ["Minutes", countdown.minutes]].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/[0.045] px-2 py-3 text-center">
                    <span className="block text-2xl font-semibold tabular-nums text-white">{String(value).padStart(2, "0")}</span>
                    <span className="mt-1 block text-[10px] uppercase tracking-widest text-muted">{label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3">
              <FlightCard label="Arrivée à Dublin" time={trip.flights.arrival.time} date="Mar. 20 oct." detail={`Départ ${trip.flights.arrival.departureTime}`} icon={Plane} />
              <FlightCard label="Vol retour" time={trip.flights.departure.time} date="Ven. 23 oct." detail={`Arrivée ${trip.flights.departure.arrivalTime}`} icon={ArrowRight} />
            </div>
          </div>
        </div>
      </motion.section>

      <section>
        <SectionHeading eyebrow="Le point de chute" title="Bienvenue à Dublin" description={trip.hotel.description} />
        <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div className="glass-card flex flex-col justify-between gap-5 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Votre hôtel</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{trip.hotel.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{trip.hotel.address}</p>
            </div>
            <Button href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.hotel.name)}`} icon={ArrowRight} variant="secondary" target="_blank" rel="noreferrer">Voir sur la carte</Button>
          </div>
          <WeatherWidget />
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Avant de partir" title="Les petits essentiels" description="Quelques réflexes utiles notés dans votre carnet." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trip.checklist.slice(0, 3).map((item, index) => (
            <div key={item} className="glass-card flex items-start gap-3 rounded-2xl p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-mint/[0.08] text-mint"><Umbrella size={16} /></span>
              <p className="pt-1 text-sm leading-5 text-slate-300">{item}</p>
              <span className="ml-auto pt-1 text-xs text-muted">0{index + 1}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end"><Link to="/checklist" className="text-sm font-semibold text-mint hover:text-emerald-200">Ouvrir la checklist valise <ArrowRight className="ml-1 inline" size={15} /></Link></div>
      </section>
    </div>
  );
}
