import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "./AdminAuth";
import { getSharedLocation } from "../services/familyService";
import { publishApproximateLocation, stopLocationSharing } from "../services/locationService";
import { supabase } from "../services/supabaseClient";

const LocationSharingContext = createContext(null);

function distanceInMeters(first, second) {
  const radians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function LocationSharingProvider({ children }) {
  const { session, isAdmin, loading: authLoading } = useAdminAuth();
  const [sharing, setSharing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const watchId = useRef(null);
  const lastSent = useRef(null);
  const canShare = Boolean(session?.access_token && isAdmin);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      setSharing(Boolean(await getSharedLocation()));
    } catch (loadError) {
      setError(`Impossible de vérifier le partage : ${loadError.message}`);
    }
  }, []);

  const sendPosition = useCallback(async (position) => {
    if (!session?.access_token || !isAdmin) {
      throw new Error("Seuls les administrateurs connectés peuvent partager la position.");
    }
    const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    const now = Date.now();
    if (lastSent.current && now - lastSent.current.time < 60_000 && distanceInMeters(lastSent.current.position, next) < 100) return;
    await publishApproximateLocation(next.latitude, next.longitude);
    lastSent.current = { position: next, time: now };
    setSharing(true);
    setError("");
  }, [session?.access_token, isAdmin]);

  useEffect(() => {
    void refresh();
    if (!supabase) return undefined;
    const channel = supabase.channel("admin-live-location-state")
      .on("postgres_changes", { event: "*", schema: "public", table: "family_locations" }, () => void refresh())
      .subscribe();
    return () => {
      if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    if (authLoading || canShare || watchId.current === null) return;
    if (navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    lastSent.current = null;
    setTracking(false);
    setError("Le partage GPS est arrêté : une session administrateur est nécessaire pour émettre la position.");
  }, [authLoading, canShare]);

  const startSharing = useCallback(async () => {
    setError("");
    if (!session?.access_token || !isAdmin) {
      setError("Seuls les administrateurs connectés peuvent partager la position.");
      return;
    }
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible dans ce navigateur.");
      return;
    }
    setBusy(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          maximumAge: 30_000,
          timeout: 20_000,
        });
      });
      await sendPosition(position);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = navigator.geolocation.watchPosition(
        (nextPosition) => void sendPosition(nextPosition).catch((locationError) => setError(`Échec de la mise à jour GPS : ${locationError.message}`)),
        (geoError) => {
          if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
          setTracking(false);
          setError(`La géolocalisation a été interrompue : ${geoError.message}`);
        },
        { enableHighAccuracy: false, maximumAge: 30_000, timeout: 20_000 },
      );
      setTracking(true);
    } catch (startError) {
      setError(startError.code ? `Autorisez la géolocalisation pour activer le partage : ${startError.message}` : `Impossible de partager la position : ${startError.message}`);
    } finally {
      setBusy(false);
    }
  }, [sendPosition, session?.access_token, isAdmin]);

  const disableSharing = useCallback(async () => {
    setBusy(true);
    setError("");
    if (!session?.access_token || !isAdmin) {
      setError("Seuls les administrateurs connectés peuvent désactiver le partage.");
      setBusy(false);
      return;
    }
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    lastSent.current = null;
    setTracking(false);
    try {
      await stopLocationSharing();
      setSharing(false);
    } catch (stopError) {
      setError(`Impossible de désactiver le partage : ${stopError.message}`);
    } finally {
      setBusy(false);
    }
  }, [session?.access_token, isAdmin]);

  const value = useMemo(() => ({
    sharing, tracking, busy, error, startSharing, disableSharing,
  }), [sharing, tracking, busy, error, startSharing, disableSharing]);

  return <LocationSharingContext.Provider value={value}>{children}</LocationSharingContext.Provider>;
}

export function useLocationSharing() {
  const context = useContext(LocationSharingContext);
  if (!context) throw new Error("useLocationSharing doit être utilisé dans LocationSharingProvider.");
  return context;
}
