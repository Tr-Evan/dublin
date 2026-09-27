import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getPendingFamilyUpdateCount, syncQueuedFamilyUpdates } from "../services/timelineService";
import { supabase } from "../services/supabaseClient";

const OfflineSyncContext = createContext(null);

function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const syncInProgress = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await getPendingFamilyUpdateCount());
  }, []);

  const syncQueue = useCallback(async () => {
    if (!supabase || navigator.onLine === false || syncInProgress.current) return;
    syncInProgress.current = true;
    setSyncing(true);
    setError("");
    try {
      await syncQueuedFamilyUpdates();
      await refreshPendingCount();
    } catch (syncError) {
      setError(`La synchronisation du journal a échoué. ${syncError.message}`);
      await refreshPendingCount();
    } finally {
      syncInProgress.current = false;
      setSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    void refreshPendingCount();
    if (navigator.onLine !== false) void syncQueue();
    window.addEventListener("online", syncQueue);
    return () => window.removeEventListener("online", syncQueue);
  }, [refreshPendingCount, syncQueue]);

  return { pendingCount, syncing, error, refreshPendingCount, syncQueue };
}

export function OfflineSyncProvider({ children }) {
  const state = useOfflineSync();
  return createElement(OfflineSyncContext.Provider, { value: state }, children);
}

export function useOfflineSyncState() {
  const state = useContext(OfflineSyncContext);
  if (!state) throw new Error("useOfflineSyncState doit être utilisé dans OfflineSyncProvider.");
  return state;
}
