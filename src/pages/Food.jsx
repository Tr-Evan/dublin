import { motion } from "framer-motion";
import { Utensils } from "lucide-react";
import PlaceCard from "../components/ui/PlaceCard";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";
import usePlaces from "../hooks/usePlaces";

export default function Food() {
  const { places, loading, error } = usePlaces("food");
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="amber" icon={Utensils}>Bonnes adresses & menus</Badge>
        <SectionHeading eyebrow="À table" title="Dublin se savoure" description="Boxty réconfortant, dîner au bord de la Liffey et brunch plein de soleil : les adresses du carnet." />
      </motion.div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && !places.length && <p className="text-sm text-muted">Chargement des restaurants…</p>}
        {error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{error}</p>}
        {!loading && !places.length && !error && <p className="glass-card rounded-2xl p-4 text-sm text-muted">Les adresses apparaîtront après initialisation du carnet dans l'espace admin.</p>}
        {places.map((place, index) => <motion.div key={place.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}><PlaceCard place={place} /></motion.div>)}
      </div>
      <p className="mt-5 text-xs leading-5 text-muted">Menus et prix reproduits à titre indicatif depuis le carnet de voyage ; ils peuvent évoluer selon le restaurant.</p>
    </div>
  );
}
