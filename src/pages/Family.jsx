import { motion } from "framer-motion";
import { CalendarDays, Check, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import FamilyMap from "../components/family/FamilyMap";
import Badge from "../components/ui/Badge";
import SectionHeading from "../components/ui/SectionHeading";
import useSchedule from "../hooks/useSchedule";
import { trip } from "../data/itineraryData";
import { supabase } from "../services/supabaseClient";

const tripDays = Array.from({ length: 4 }, (_, index) => {
  const date = new Date(2026, 9, 20 + index, 12);
  return { key: `2026-10-${String(20 + index).padStart(2, "0")}`, date };
});

function visitLabel(visitDate, visited) {
  if (visited) return "Visité";
  const today = new Date();
  const day = new Date(`${visitDate}T12:00:00`);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (day.toDateString() === today.toDateString()) return "Prévu aujourd'hui";
  if (day.toDateString() === tomorrow.toDateString()) return "Prévu demain";
  return "Prévu";
}

export default function Family() {
  const { schedule, loading, error } = useSchedule();
  const configured = Boolean(supabase);

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="hero-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-9">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-mint/[0.09] blur-3xl" />
        <div className="relative">
          <Badge tone="mint" icon={Sparkles}>Un petit coucou de Dublin</Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">La famille, en direct.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Suivez les nouvelles de voyage d'Enola et Evan, et découvrez ce qu'ils ont déjà exploré.</p>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><LockKeyhole size={14} className="text-mint" />Position visible seulement lorsqu'elle est activée par l'un d'eux ; précision réduite à environ 100 m.</p>
        </div>
      </motion.section>

      {!configured && <p role="alert" className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4 text-sm text-amber-100">La page famille affichera les informations partagées après configuration de Supabase dans le fichier .env.</p>}
      <FamilyMap />

      <section>
        <SectionHeading eyebrow="20–23 octobre 2026" title="Le programme en famille" description={loading ? "Mise à jour du carnet…" : "Les visites cochées apparaissent en direct pour toute la famille."} />
        {error && <p role="alert" className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{error}</p>}
        <div className="space-y-4">
          {tripDays.map(({ key, date }, index) => {
            const activities = schedule.filter((item) => item.visit_date === key);
            return (
              <article key={key} className="glass-card rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint/[0.08] text-mint"><CalendarDays size={19} /></span>
                  <div>
                    <p className="text-sm font-semibold capitalize text-white">{date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                    <p className="mt-0.5 text-xs text-muted">{index === 0 ? "Arrivée à Dublin à 18 h 10" : index === 3 ? "Vol retour à 17 h 10" : "Une nouvelle journée à Dublin"}</p>
                  </div>
                </div>
                {activities.length ? (
                  <ol className="mt-5 space-y-3 border-l border-white/10 pl-4 sm:ml-5">
                    {activities.map((activity) => {
                      const place = Array.isArray(activity.places) ? activity.places[0] : activity.places;
                      if (!place) return null;
                      const visited = Boolean(activity.visited);
                      return (
                        <li key={activity.id} className="relative rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                          <span className={`absolute -left-[1.34rem] top-5 h-2.5 w-2.5 rounded-full border-2 border-ink ${visited ? "bg-mint" : "bg-slate-500"}`} />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`font-medium ${visited ? "text-mint" : "text-white"}`}>{place.name}</p>
                              <p className="mt-1 text-xs text-muted">{place.address}</p>
                            </div>
                            <Badge tone={visited ? "mint" : "neutral"} icon={visited ? Check : Clock3}>{visitLabel(activity.visit_date, visited)}</Badge>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : <p className="mt-4 rounded-2xl bg-white/[0.025] p-4 text-sm text-muted">{configured ? "Le programme de cette journée se prépare…" : "Le programme apparaîtra ici après la configuration de Supabase."}</p>}
              </article>
            );
          })}
        </div>
        {!schedule.length && configured && !loading && <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Clock3 size={14} />Les visites seront ajoutées au calendrier depuis l'espace admin.</p>}
      </section>
      <p className="pb-3 text-center text-xs text-muted">{trip.title} · Dublin · octobre 2026</p>
    </div>
  );
}
