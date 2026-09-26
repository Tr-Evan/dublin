import { Compass, FileLock2, Home, Martini, ShieldCheck, Users, Utensils } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/visites", label: "Visites", icon: Compass },
  { to: "/food", label: "Food", icon: Utensils },
  { to: "/pubs", label: "Pubs", icon: Martini },
  { to: "/family", label: "Famille", icon: Users },
  { to: "/documents", label: "Coffre", icon: FileLock2 },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

export default function BottomNavigation() {
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:inset-y-0 lg:right-auto lg:w-24 lg:border-r lg:border-t-0 lg:px-3 lg:py-8">
      <div className="mx-auto flex max-w-md items-center justify-around lg:h-full lg:flex-col lg:justify-start lg:gap-7">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-[9px] font-medium transition sm:text-[10px] lg:min-w-0 lg:flex-none lg:px-2 lg:py-3 ${isActive ? "bg-mint/[0.1] text-mint" : "text-muted hover:text-white"}`}
          >
            <Icon size={19} strokeWidth={1.8} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
