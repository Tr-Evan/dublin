import { useCallback, useEffect, useState } from "react";
import { getCachedSchedule, getSchedule } from "../services/familyService";
import { supabase } from "../services/supabaseClient";

export default function useSchedule() {
  const [schedule, setSchedule] = useState(() => getCachedSchedule());
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      setSchedule(await getSchedule());
      setError("");
    } catch (loadError) {
      setError(`Impossible de charger le programme. ${loadError.message}`);
      if (navigator.onLine === false) setSchedule(getCachedSchedule());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    void refresh();
    const channel = supabase
      .channel("family-itinerary")
      .on("postgres_changes", { event: "*", schema: "public", table: "day_schedule" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  return { schedule, loading, error, refresh };
}
