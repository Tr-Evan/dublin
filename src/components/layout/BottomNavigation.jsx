import { useLocation, NavLink } from "react-router-dom";
import { Compass, FileLock2, Home, Users } from "lucide-react";

const navigationItems = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/explorer", label: "Explorer", icon: Compass },
  { to: "/documents", label: "Coffre-fort", icon: FileLock2 },
  { to: "/family", label: "Famille", icon: Users },
];

const explorePaths = ["/explorer", "/programme", "/visites", "/food", "/pubs"];

export default function BottomNavigation() {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-ink/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl md:inset-y-0 md:right-auto md:w-64 md:border-r md:border-t-0 md:px-4 md:py-6">
      <div className="mx-auto flex max-w-md items-stretch justify-around md:max-w-none md:flex-col md:justify-start md:gap-1">
        {navigationItems.map(({ to, label, icon: Icon, end }) => {
          const isExploreItem = to === "/explorer" && explorePaths.includes(pathname);
          const isOtherItem = to !== "/" && pathname.startsWith(to);
          const active = to === "/" ? pathname === "/" : isExploreItem || isOtherItem;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-semibold transition sm:text-[10px] md:w-full md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-sm ${active ? "bg-mint/[0.1] text-mint" : "text-muted hover:bg-white/[0.04] hover:text-white"}`}
            >
              <Icon size={19} strokeWidth={1.8} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
