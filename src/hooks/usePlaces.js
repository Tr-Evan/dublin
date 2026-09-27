import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "../auth/AdminAuth";
import { pubs, restaurants, visits } from "../data/itineraryData";
import { getCachedPlaces, getPlaces } from "../services/placeService";
import { supabase } from "../services/supabaseClient";

const staticPlaces = { visite: visits, food: restaurants, pub: pubs };

export default function usePlaces(kind) {
  const { isAdmin } = useAdminAuth();
  const [places, setPlaces] = useState(() => {
    const cached = isAdmin && supabase ? getCachedPlaces(kind) : [];
    return cached.length ? cached : staticPlaces[kind] ?? [];
  });
  const [loading, setLoading] = useState(Boolean(supabase && isAdmin));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setPlaces(staticPlaces[kind] ?? []);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPlaces(await getPlaces(kind));
      setError("");
    } catch (loadError) {
      const cachedPlaces = supabase ? getCachedPlaces(kind) : [];
      setPlaces(cachedPlaces.length ? cachedPlaces : staticPlaces[kind] ?? []);
      setError("");
      console.warn(`Chargement des adresses indisponible ; affichage du carnet local. ${loadError.message}`);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, kind]);

  useEffect(() => {
    void refresh();
    if (!supabase || !isAdmin) return undefined;

    const channel = supabase
      .channel(`places-${kind}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "places", filter: `kind=eq.${kind}` }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [isAdmin, kind, refresh]);

  return { places, loading, error, refresh };
}
