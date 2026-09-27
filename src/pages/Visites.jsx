import { motion } from "framer-motion";
import { Bus, CreditCard, Footprints, TramFront } from "lucide-react";
import { trip } from "../data/itineraryData";
import PlaceCard from "../components/ui/PlaceCard";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";
import usePlaces from "../hooks/usePlaces";

const transportIcons = [Footprints, CreditCard, Bus, TramFront];

export default function Visites() {
  const { places, loading, error } = usePlaces("visite");
  return (
    <div className="space-y-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="mint">Culture · histoire · découverte</Badge>
        <SectionHeading eyebrow="Carnet partagé" title="Les incontournables" description="De la Long Room à la Guinness, les visites du séjour et leurs infos pratiques." />
      </motion.div>
      <section className="grid gap-4 md:grid-cols-2">
        {loading && !places.length && <p className="text-sm text-muted">Chargement des visites…</p>}
        {error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{error}</p>}
        {!loading && !places.length && !error && <p className="glass-card rounded-2xl p-4 text-sm text-muted">Les visites apparaîtront ici après initialisation du carnet dans l'espace admin.</p>}
        {places.map((place, index) => <motion.div key={place.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}><PlaceCard place={place} /></motion.div>)}
      </section>
      <section>
        <SectionHeading eyebrow="Bouger simplement" title="Dublin sans voiture" description="Les conseils transport depuis O'Connell Street, à proximité de l’hôtel." />
        <div className="grid gap-3 sm:grid-cols-2">
          {trip.transport.map((item, index) => {
            const Icon = transportIcons[index];
            return (
              <div key={item.name} className="glass-card flex gap-4 rounded-3xl p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/[0.09] text-mint"><Icon size={19} /></span>
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{item.name}</h3><Badge tone="mint">{item.fare}</Badge></div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-sm leading-6 text-slate-400">
          Astuce : téléchargez l'application TFI Live pour consulter les horaires de bus et les itinéraires en temps réel.
        </p>
      </section>
      <section>
        <SectionHeading eyebrow="Avant le départ" title="Checklist du duo" description="Coupe-vent, adaptateur et réservations : tous les indispensables d’Enola & Evan." action={<a href="/checklist" className="whitespace-nowrap text-sm font-semibold text-mint hover:text-emerald-200">Voir la checklist →</a>} />
      </section>
    </div>
  );
}
