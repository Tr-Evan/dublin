import { motion } from "framer-motion";
import { ArrowUpRight, Camera, Coffee, Martini, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import SectionHeading from "../components/ui/SectionHeading";
import foodImage from "../assets/foods.png";
import pubsImage from "../assets/pubs.png";
import visitsImage from "../assets/visites.png";

const categories = [
  {
    to: "/visites",
    title: "Visites",
    subtitle: "Culture, histoire & incontournables",
    image: visitsImage,
    icon: Camera,
    imageAlt: "Vue aérienne du centre de Dublin",
  },
  {
    to: "/food",
    title: "Food",
    subtitle: "Bonnes tables & pauses gourmandes",
    image: foodImage,
    icon: Utensils,
    imageAlt: "Plat irlandais servi dans une assiette",
  },
  {
    to: "/pubs",
    title: "Pubs",
    subtitle: "Adresses chaleureuses & musique live",
    image: pubsImage,
    icon: Martini,
    imageAlt: "Façade du Temple Bar à Dublin",
  },
];

function CategoryCard({ category, index }) {
  const { to, title, subtitle, image, icon: Icon, imageAlt } = category;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <Link to={to} className="group relative isolate flex min-h-[22rem] overflow-hidden rounded-[2rem] border border-white/10 shadow-glow transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint sm:min-h-[26rem]">
        <img src={image} alt={imageAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/45" />
        <span className="gradient-blur relative z-10 mt-auto flex w-full items-end justify-between gap-3 p-5 backdrop-blur-md sm:p-6">
          <span>
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.08] text-mint"><Icon size={19} /></span>
            <span className="block text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</span>
            <span className="mt-1 block text-sm text-slate-200">{subtitle}</span>
          </span>
          <span aria-hidden="true" className="mb-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 text-white transition group-hover:border-mint/50 group-hover:bg-mint/10 group-hover:text-mint"><ArrowUpRight size={20} /></span>
        </span>
      </Link>
    </motion.div>
  );
}

export default function Explore() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="hero-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-9">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-mint/[0.09] blur-3xl" />
        <div className="relative">
          <Badge tone="mint" icon={Coffee}>Le carnet de Dublin</Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Le programme de Dublin</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Toutes les idées de sorties, de bonnes tables et de pubs réunies au même endroit.</p>
        </div>
      </section>
      <section aria-label="Explorer par catégorie">
        <SectionHeading eyebrow="À la découverte de Dublin" title="Choisir une escale" description="Visites, tables et pubs : le programme partagé d’Evan & Enola." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => <CategoryCard key={category.to} category={category} index={index} />)}
        </div>
      </section>
    </div>
  );
}
