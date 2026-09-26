import { useCallback, useEffect, useState } from "react";
import { getCachedFamilyUpdates, getFamilyUpdates } from "../services/timelineService";
import { supabase } from "../services/supabaseClient";

export default function useFamilyUpdates() {
  const [updates, setUpdates] = useState(() => getCachedFamilyUpdates());
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setUpdates(await getFamilyUpdates());
      setError("");
    } catch (loadError) {
      setError(`Impossible d'actualiser le journal. ${loadError.message}`);
      if (navigator.onLine === false) setUpdates(getCachedFamilyUpdates());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!supabase) return undefined;
    const channel = supabase.channel("family-travel-timeline")
      .on("postgres_changes", { event: "*", schema: "public", table: "family_updates" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  return { updates, setUpdates, loading, error, refresh };
}
