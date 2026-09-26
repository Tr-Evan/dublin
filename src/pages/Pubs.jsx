import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import PlaceCard from "../components/ui/PlaceCard";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";
import usePlaces from "../hooks/usePlaces";

export default function Pubs() {
  const { places, loading, error } = usePlaces("pub");
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="rose" icon={Music2}>Trad sessions · musique live</Badge>
        <SectionHeading eyebrow="Ce soir, on sort" title="L'âme des pubs irlandais" description="Un pub historique, des musiciens locaux et l'icône rouge de Temple Bar : à chacune son ambiance." />
      </motion.div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && !places.length && <p className="text-sm text-muted">Chargement des pubs…</p>}
        {error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{error}</p>}
        {!loading && !places.length && !error && <p className="glass-card rounded-2xl p-4 text-sm text-muted">Les pubs apparaîtront après initialisation du carnet dans l'espace admin.</p>}
        {places.map((place, index) => <motion.div key={place.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}><PlaceCard place={place} /></motion.div>)}
      </div>
      <section className="mt-10">
        <SectionHeading eyebrow="La carte du comptoir" title="Un petit guide des boissons" description="Repères de prix indicatifs issus du carnet — pensez à vérifier la carte sur place." />
        <div className="glass-card grid gap-3 rounded-3xl p-5 sm:grid-cols-2 lg:grid-cols-3">
          {(places.find((place) => place.id === "cobblestone")?.details ?? []).slice(1).map((drink) => (
            <div key={drink.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white">{drink.title}</h3><Badge tone="amber">{drink.price}</Badge></div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{drink.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
