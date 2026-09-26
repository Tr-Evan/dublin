import { useCallback, useEffect, useState } from "react";
import { getChecklistItems } from "../services/checklistService";
import { supabase } from "../services/supabaseClient";

export default function useChecklist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("Configurez Supabase pour enregistrer et synchroniser votre checklist.");
      return;
    }
    setLoading(true);
    try {
      setItems(await getChecklistItems());
      setError("");
    } catch (loadError) {
      setError(`Impossible d'actualiser la checklist. ${loadError.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!supabase) return undefined;
    const channel = supabase.channel("departure-checklist")
      .on("postgres_changes", { event: "*", schema: "public", table: "departure_checklist" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  return { items, setItems, loading, error, refresh };
}
