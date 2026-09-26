import { useCallback, useEffect, useState } from "react";
import { getCachedPlaces, getPlaces } from "../services/placeService";
import { supabase } from "../services/supabaseClient";

export default function usePlaces(kind) {
  const [places, setPlaces] = useState(() => supabase ? getCachedPlaces(kind) : []);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPlaces(await getPlaces(kind));
      setError("");
    } catch (loadError) {
      setError(`Impossible d'actualiser les adresses. ${loadError.message}`);
      if (navigator.onLine === false && supabase) setPlaces(getCachedPlaces(kind));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void refresh();
    if (!supabase) return undefined;

    const channel = supabase
      .channel(`places-${kind}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "places", filter: `kind=eq.${kind}` }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [kind, refresh]);

  return { places, loading, error, refresh };
}
