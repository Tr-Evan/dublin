import { useCallback, useEffect, useMemo, useState } from "react";
import { cacheDocumentForOffline, documentSlots, getOfflineDocuments, getTravelDocuments, readTravelDocument } from "../../services/documentService";
import { supabase } from "../../services/supabaseClient";

function isCached(id, saved) {
  return saved.some((document) => document.id === id);
}

export default function useVaultDocuments() {
  const [documents, setDocuments] = useState([]);
  const [savedOffline, setSavedOffline] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [offline, setOffline] = useState(false);
  const [offlineWarning, setOfflineWarning] = useState("");
  const [preview, setPreview] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setSavedOffline(await getOfflineDocuments());
    } catch (storageError) {
      setError(`Impossible de lire les fichiers enregistrés sur cet appareil : ${storageError.message}`);
      return;
    }
    if (!supabase || navigator.onLine === false) {
      setDocuments([]);
      setOffline(true);
      return;
    }
    try {
      setDocuments(await getTravelDocuments());
      setOffline(false);
    } catch (loadError) {
      setError(`Impossible de charger le coffre-fort. ${loadError.message}`);
      setDocuments([]);
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleNetworkChange = () => void refresh();
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    if (!supabase) return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
    const channel = supabase.channel("travel-documents")
      .on("postgres_changes", { event: "*", schema: "public", table: "travel_documents" }, () => void refresh())
      .subscribe();
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const displayedDocuments = useMemo(() => {
    const onlineIds = new Set(documents.map((document) => document.id));
    return [...documents, ...savedOffline.filter((document) => !onlineIds.has(document.id))];
  }, [documents, savedOffline]);

  const cachedTicketCount = useMemo(() => documentSlots.filter((slot) => {
    const document = documents.find((item) => item.slot_key === slot.key)
      ?? savedOffline.find((item) => item.slotKey === slot.key);
    return document && isCached(document.id, savedOffline);
  }).length, [documents, savedOffline]);

  async function handleDownload(document) {
    setBusy(document.id);
    setError("");
    setOfflineWarning("");
    try {
      const persistent = await cacheDocumentForOffline(document);
      setSavedOffline(await getOfflineDocuments());
      if (!persistent) setOfflineWarning("Le document est enregistré hors ligne, mais le navigateur ne garantit pas sa conservation après un nettoyage du stockage.");
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setBusy("");
    }
  }

  async function handlePreview(document) {
    setBusy(document.id);
    setError("");
    try {
      const blob = await readTravelDocument(document);
      const url = URL.createObjectURL(blob);
      setPreview({ title: document.title, url, type: document.mime_type ?? document.mimeType });
      setSavedOffline(await getOfflineDocuments());
    } catch (previewError) {
      setError(`Impossible d'ouvrir le document. ${previewError.message}`);
    } finally {
      setBusy("");
    }
  }

  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  return {
    documents,
    savedOffline,
    displayedDocuments,
    cachedTicketCount,
    error,
    setError,
    busy,
    setBusy,
    offline,
    offlineWarning,
    setOfflineWarning,
    preview,
    closePreview,
    refresh,
    handleDownload,
    handlePreview,
  };
}
