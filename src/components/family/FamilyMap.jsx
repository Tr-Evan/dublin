import { Fragment, useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap, ZoomControl } from "react-leaflet";
import { MapPin, Radio } from "lucide-react";
import { getCachedFamilyLocations, getFamilyLocations } from "../../services/locationService";
import { supabase } from "../../services/supabaseClient";
import Badge from "../ui/Badge";

const liveThresholdMs = 5 * 60_000;
const travelerColors = { Evan: "#79f2b2", Enola: "#67d4ff" };

function getLocationStatus(location, now = Date.now()) {
  const timestamp = location.updated_at ?? location.created_at;
  const updatedAt = timestamp ? new Date(timestamp) : null;
  const age = updatedAt ? now - updatedAt.getTime() : Number.NaN;
  const isLive = Number.isFinite(age) && age >= 0 && age < liveThresholdMs;
  return {
    isLive,
    time: updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "heure inconnue",
  };
}

function mergeLocations(previous, incoming) {
  const merged = new Map(previous.map((location) => [location.traveler, location]));
  incoming.forEach((location) => {
    const current = merged.get(location.traveler);
    const currentTime = new Date(current?.updated_at ?? current?.created_at ?? 0).getTime();
    const incomingTime = new Date(location.updated_at ?? location.created_at ?? 0).getTime();
    if (!current || incomingTime >= currentTime) merged.set(location.traveler, location);
  });
  return [...merged.values()];
}

function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([Number(location.latitude), Number(location.longitude)], map.getZoom(), { animate: true });
  }, [location.latitude, location.longitude, map]);
  return null;
}

export default function FamilyMap() {
  const [locations, setLocations] = useState(getCachedFamilyLocations);
  const [now, setNow] = useState(Date.now);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase) && navigator.onLine !== false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const nextLocations = await getFamilyLocations();
        if (active) {
          setLocations((current) => mergeLocations(current, nextLocations));
          setError("");
        }
      } catch (loadError) {
        if (active) setError(`Impossible d'actualiser les positions ; les dernières positions enregistrées sont conservées. ${loadError.message}`);
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const handleOnline = () => void refresh();
    window.addEventListener("online", handleOnline);
    const channel = supabase?.channel("family-location-markers")
      .on("postgres_changes", { event: "*", schema: "public", table: "family_location_markers" }, () => void refresh())
      .subscribe();
    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const latestLocation = locations.reduce((latest, location) => (
    !latest || new Date(location.updated_at ?? location.created_at).getTime() > new Date(latest.updated_at ?? latest.created_at).getTime()
      ? location
      : latest
  ), null);
  const hasLiveLocation = locations.some((location) => getLocationStatus(location, now).isLive);

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">La petite balise familiale</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Où en est le voyage ?</h2>
          <p className="mt-1 text-sm text-muted">Les dernières positions restent visibles, même lorsque le suivi est arrêté.</p>
        </div>
        <Badge tone={hasLiveLocation ? "mint" : "neutral"} icon={hasLiveLocation ? Radio : MapPin}>
          {loading ? "Connexion…" : hasLiveLocation ? "Au moins un voyageur en direct" : locations.length ? "Dernières positions" : "Aucune position"}
        </Badge>
      </div>
      {error && <p role="alert" className="mx-5 mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200 sm:mx-6">{error}</p>}
      {locations.length ? (
        <>
          <MapContainer center={[Number(latestLocation.latitude), Number(latestLocation.longitude)]} zoom={14} scrollWheelZoom={false} zoomControl={false} className="family-map">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution='Labels &copy; <a href="https://www.esri.com/" rel="noreferrer">Esri</a>'
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            />
            <ZoomControl position="bottomright" />
            <RecenterMap location={latestLocation} />
            {locations.map((location) => {
              const status = getLocationStatus(location, now);
              const color = status.isLive ? travelerColors[location.traveler] : "#94a3b8";
              const coordinates = [Number(location.latitude), Number(location.longitude)];
              return (
                <Fragment key={location.traveler}>
                  <Circle center={coordinates} radius={110} pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 1 }} />
                  <CircleMarker center={coordinates} radius={9} pathOptions={{ color: "#0b1210", fillColor: color, fillOpacity: 1, weight: 4 }}>
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-lg ${status.isLive ? "border-emerald-200/60 bg-emerald-950/90 text-emerald-100" : "border-slate-300/50 bg-slate-900/90 text-slate-200"}`}>
                        {status.isLive && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />}
                        {location.traveler} · {status.isLive ? "📍 En direct" : `Dernière position connue à ${status.time}`}
                      </span>
                    </Tooltip>
                  </CircleMarker>
                </Fragment>
              );
            })}
          </MapContainer>
          <p className="border-t border-white/[0.06] px-5 py-3 text-xs leading-5 text-muted sm:px-6">Positions approximatives, à environ 100 m près. Les marqueurs restent visibles jusqu’à leur prochaine mise à jour.</p>
        </>
      ) : (
        <div className="mx-5 mb-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center sm:mx-6">
          <MapPin size={23} className="mx-auto text-mint" />
          <p className="mt-3 text-sm font-medium text-white">{loading ? "Chargement des positions…" : "Aucune position enregistrée"}</p>
          <p className="mt-1 text-xs leading-5 text-muted">Evan et Enola apparaîtront ici après leur première activation du partage.</p>
        </div>
      )}
    </section>
  );
}
