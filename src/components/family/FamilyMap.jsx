import { useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { MapPin, Radio } from "lucide-react";
import { getSharedLocation } from "../../services/familyService";
import { supabase } from "../../services/supabaseClient";
import { useAdminAuth } from "../../auth/AdminAuth";
import Badge from "../ui/Badge";

function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([Number(location.latitude), Number(location.longitude)], map.getZoom(), { animate: true });
  }, [location.latitude, location.longitude, map]);
  return null;
}

export default function FamilyMap() {
  const { isAdmin } = useAdminAuth();
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase || !isAdmin) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    const refresh = async () => {
      try {
        const nextLocation = await getSharedLocation();
        if (active) {
          setLocation(nextLocation);
          setError("");
        }
      } catch (loadError) {
        if (active) setError(`Impossible de récupérer la position partagée : ${loadError.message}`);
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const channel = supabase.channel("family-live-location")
      .on("postgres_changes", { event: "*", schema: "public", table: "family_locations" }, () => void refresh())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!location) return undefined;
    const expiresIn = Math.max(0, new Date(location.updated_at).getTime() + 5 * 60_000 - Date.now());
    const timer = window.setTimeout(() => setLocation(null), expiresIn);
    return () => window.clearTimeout(timer);
  }, [location]);

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">La petite balise familiale</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Où en est le voyage ?</h2>
          <p className="mt-1 text-sm text-muted">{isAdmin ? "La position est accessible uniquement aux comptes voyageurs autorisés." : "La localisation est réservée aux comptes voyageurs autorisés."}</p>
        </div>
        <Badge tone={location ? "mint" : "neutral"} icon={location ? Radio : MapPin}>
          {loading ? "Connexion…" : location ? "Partage activé" : "Position privée"}
        </Badge>
      </div>
      {error && <p role="alert" className="mx-5 mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200 sm:mx-6">{error}</p>}
      {location ? (
        <>
          <MapContainer center={[Number(location.latitude), Number(location.longitude)]} zoom={14} scrollWheelZoom={false} zoomControl={false} className="family-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            <RecenterMap location={location} />
            <Circle center={[Number(location.latitude), Number(location.longitude)]} radius={110} pathOptions={{ color: "#79f2b2", fillColor: "#79f2b2", fillOpacity: 0.12, weight: 1 }} />
            <CircleMarker center={[Number(location.latitude), Number(location.longitude)]} radius={9} pathOptions={{ color: "#0b1210", fillColor: "#79f2b2", fillOpacity: 1, weight: 4 }} />
          </MapContainer>
          <p className="border-t border-white/[0.06] px-5 py-3 text-xs leading-5 text-muted sm:px-6">
            Position volontairement approximative, à environ 100 m près · mise à jour {new Date(location.updated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </>
      ) : (
        <div className="mx-5 mb-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center sm:mx-6">
          <MapPin size={23} className="mx-auto text-mint" />
          <p className="mt-3 text-sm font-medium text-white">{loading ? "Chargement de la position…" : "Aucune position en direct"}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{isAdmin ? "Aucune position n’est partagée pour le moment." : "La position reste privée sur cette page publique."}</p>
        </div>
      )}
    </section>
  );
}
