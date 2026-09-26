import { useEffect, useState } from "react";
import { Archive, Compass, Ellipsis, FileLock2, Home, Martini, ShieldCheck, Users, Utensils } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const mainLinks = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/visites", label: "Visites", icon: Compass },
  { to: "/food", label: "Food", icon: Utensils },
  { to: "/pubs", label: "Pubs", icon: Martini },
  { to: "/family", label: "Famille", icon: Users },
];

const moreLinks = [
  { to: "/checklist", label: "Checklist", icon: Archive },
  { to: "/documents", label: "Documents", icon: FileLock2 },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

const mainLinkClass = ({ isActive }) => `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-semibold transition sm:text-[10px] md:w-full md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-sm ${isActive ? "bg-mint/[0.1] text-mint" : "text-muted hover:bg-white/[0.04] hover:text-white"}`;

function LinkGroup({ links, onNavigate }) {
  return links.map(({ to, label, icon: Icon, end }) => (
    <NavLink key={to} to={to} end={end} onClick={onNavigate} className={mainLinkClass}>
      <Icon size={19} strokeWidth={1.8} className="shrink-0" />
      <span>{label}</span>
    </NavLink>
  ));
}

export default function BottomNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      {menuOpen && (
        <button type="button" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/30 md:hidden" />
      )}
      {menuOpen && (
        <nav aria-label="Autres pages" className="glass-card fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-3xl p-2 shadow-2xl md:hidden">
          <LinkGroup links={moreLinks} onNavigate={() => setMenuOpen(false)} />
        </nav>
      )}
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-ink/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl md:inset-y-0 md:right-auto md:w-64 md:border-r md:border-t-0 md:px-4 md:py-6">
        <div className="mx-auto flex max-w-md items-stretch justify-around md:max-w-none md:flex-col md:justify-start md:gap-1">
          <LinkGroup links={mainLinks} onNavigate={() => setMenuOpen(false)} />
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-semibold transition sm:text-[10px] md:hidden ${menuOpen ? "bg-mint/[0.1] text-mint" : "text-muted hover:text-white"}`}>
            <Ellipsis size={20} />
            <span>Plus</span>
          </button>
          <div className="hidden border-t border-white/[0.07] pt-4 md:mt-4 md:block">
            <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-muted">Votre séjour</p>
            <LinkGroup links={moreLinks} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      </nav>
    </>
  );
}
