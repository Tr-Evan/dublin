import { motion } from "framer-motion";
import { CalendarDays, Camera, Check, Clock3, LockKeyhole, MapPin, Sparkles } from "lucide-react";
import FamilyMap from "../components/family/FamilyMap";
import Badge from "../components/ui/Badge";
import SectionHeading from "../components/ui/SectionHeading";
import useFamilyUpdates from "../hooks/useFamilyUpdates";
import useSchedule from "../hooks/useSchedule";
import { trip } from "../data/itineraryData";
import { supabase } from "../services/supabaseClient";

const tripDays = Array.from({ length: 4 }, (_, index) => {
  const date = new Date(2026, 9, 20 + index, 12);
  return { key: `2026-10-${String(20 + index).padStart(2, "0")}`, date };
});

function FamilyUpdateCard({ update, isLast }) {
  const dateLabel = new Date(`${update.travel_date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return (
    <li className="relative pl-9 sm:pl-11">
      <span className="absolute left-0 top-2 grid h-7 w-7 place-items-center rounded-full border border-mint/25 bg-ink text-mint"><Camera size={13} /></span>
      {!isLast && <span aria-hidden="true" className="absolute bottom-[-1.25rem] left-[13px] top-9 w-px bg-gradient-to-b from-mint/30 to-white/[0.06]" />}
      <article className="glass-card overflow-hidden rounded-3xl">
        {update.photoUrl && <img src={update.photoUrl} alt={`Souvenir de Dublin : ${update.title}`} loading="lazy" className="max-h-[30rem] w-full object-cover" />}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2"><Badge tone="mint">{dateLabel} · {update.travel_time.slice(0, 5)}</Badge><span className="text-[11px] text-muted">Dublin</span></div>
          <h3 className="mt-3 text-lg font-semibold text-white sm:text-xl">{update.title}</h3>
          {update.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{update.description}</p>}
        </div>
      </article>
    </li>
  );
}

export default function Family() {
  const { schedule, error: scheduleError } = useSchedule();
  const { updates, loading: updatesLoading, error: updatesError } = useFamilyUpdates();
  const configured = Boolean(supabase);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="hero-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-9">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-mint/[0.09] blur-3xl" />
        <div className="relative">
          <Badge tone="mint" icon={Sparkles}>Un petit coucou de Dublin</Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Evan & sa sœur, Enola.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Quatre jours de découvertes à Dublin. Retrouvez leurs photos et petits mots au fil de la journée.</p>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><LockKeyhole size={14} className="text-mint" />La position n'apparaît que si Evan ou Enola active volontairement le partage.</p>
        </div>
      </motion.section>

      {!configured && <p role="alert" className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4 text-sm text-amber-100">La page famille se mettra à jour dès que Supabase sera configuré.</p>}
      <FamilyMap />

      <section>
        <SectionHeading eyebrow="20 — 23 octobre 2026" title="Le journal de bord" description={updatesLoading ? "Chargement des nouvelles…" : "Les dernières nouvelles d'Evan et de sa sœur, en temps réel."} />
        {updatesError && <p role="alert" className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{updatesError}</p>}
        {updates.length || schedule.length ? (
          <div className="max-w-3xl">
            {tripDays.map(({ key, date }) => {
              const dayUpdates = updates.filter((update) => update.travel_date === key);
              const dayActivities = schedule.filter((activity) => activity.visit_date === key);
              if (!dayUpdates.length && !dayActivities.length) return null;
              return (
                <section key={key} aria-label={date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} className="mb-8">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold capitalize text-white"><CalendarDays size={16} className="text-mint" />{date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</h3>
                  {dayUpdates.length
                    ? <ol className="space-y-5">{dayUpdates.map((update, updateIndex) => <FamilyUpdateCard key={update.id} update={update} isLast={updateIndex === dayUpdates.length - 1} />)}</ol>
                    : <p className="ml-9 mb-3 text-xs text-muted sm:ml-11">Pas encore de petit mot pour cette journée.</p>}
                  {dayActivities.length > 0 && <PlannedActivities activities={dayActivities} />}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="glass-card max-w-3xl rounded-3xl p-7 text-center sm:p-10">
            <Camera size={27} className="mx-auto text-mint" />
            <p className="mt-4 font-semibold text-white">{updatesLoading ? "On prépare les premières nouvelles…" : "Le voyage n'a pas encore commencé !"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Les messages et les photos partagés depuis Dublin apparaîtront ici, du plus ancien au plus récent.</p>
          </div>
        )}
        {!updatesLoading && updates.length > 0 && updates.every((update) => !tripDays.some(({ key }) => key === update.travel_date)) && <p className="text-sm text-muted">Aucun souvenir pour ces dates pour le moment.</p>}
        {scheduleError && <p role="alert" className="mt-4 text-sm text-rose-200">{scheduleError}</p>}
      </section>
      <p className="pb-3 text-center text-xs text-muted">{trip.title} · octobre 2026</p>
    </div>
  );
}

function PlannedActivities({ activities }) {
  return (
    <aside className="ml-9 mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:ml-11">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Au programme · horaire non précisé</p>
      <ul className="space-y-2">
        {activities.map((activity) => {
          const place = Array.isArray(activity.places) ? activity.places[0] : activity.places;
          if (!place) return null;
          return <li key={activity.id} className={`flex items-start gap-2 text-sm ${activity.visited ? "text-mint" : "text-slate-300"}`}><span>{activity.visited ? <Check size={15} /> : <Clock3 size={15} className="text-muted" />}</span><span className={activity.visited ? "line-through opacity-75" : ""}>{place.name}<span className="ml-2 text-xs text-muted"><MapPin size={12} className="mr-1 inline" />{place.address}</span></span></li>;
        })}
      </ul>
    </aside>
  );
}
