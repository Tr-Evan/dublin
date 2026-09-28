import { openDB } from "idb";
import { supabase } from "./supabaseClient";

const bucket = "travel-documents";
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const maxFileSize = 15 * 1024 * 1024;
const database = openDB("dublin-travel-documents", 1, {
  upgrade(db) {
    db.createObjectStore("offline-documents", { keyPath: "id" });
  },
});

export const documentSlots = [
  { key: "outbound-evan", title: "Billet d'avion Aller - Evan" },
  { key: "return-evan", title: "Billet d'avion Retour - Evan" },
  { key: "outbound-enola", title: "Billet d'avion Aller - Enola" },
  { key: "return-enola", title: "Billet d'avion Retour - Enola" },
];

export function validateTravelDocument(file) {
  const extension = file.name?.split(".").pop()?.toLowerCase();
  const supportedExtension = allowedExtensions.has(extension);
  const supportedType = allowedTypes.has(file.type);
  const genericMobileType = !file.type || file.type === "application/octet-stream";
  if (!supportedExtension || (!supportedType && !genericMobileType)) {
    throw new Error("Formats acceptés : PDF, JPEG, PNG ou WebP.");
  }
  if (file.size > maxFileSize) throw new Error("La taille maximale autorisée est de 15 Mo.");
}

function getTravelDocumentMimeType(file) {
  if (allowedTypes.has(file.type)) return file.type;
  const extension = file.name?.split(".").pop()?.toLowerCase();
  const mimeByExtension = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return mimeByExtension[extension];
}

export async function getTravelDocuments() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("travel_documents").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOfflineDocuments() {
  return (await database).getAll("offline-documents");
}

async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

export async function readTravelDocument(document) {
  const db = await database;
  let saved = await db.get("offline-documents", document.id);

  if (!saved) {
    if (!supabase) throw new Error("Le document n'est pas enregistré sur cet appareil.");
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(document.file_path, 120);
    if (error) throw new Error(error.message);
    const response = await fetch(data.signedUrl);
    if (!response.ok) throw new Error("Impossible de télécharger le document pour le mode hors ligne.");
    saved = {
      id: document.id,
      title: document.title,
      slotKey: document.slot_key ?? document.slotKey ?? null,
      mimeType: document.mime_type,
      fileSize: document.file_size,
      createdAt: document.created_at,
      blob: await response.blob(),
    };
    await db.put("offline-documents", saved);
    await requestPersistentStorage();
  }

  return saved.blob;
}

export async function saveTravelDocumentOffline(document, file) {
  validateTravelDocument(file);
  const mimeType = getTravelDocumentMimeType(file);
  const savedDocument = {
    id: document.id,
    title: document.title,
    slotKey: document.slot_key ?? document.slotKey ?? null,
    mimeType: document.mime_type ?? document.mimeType ?? mimeType,
    fileSize: file.size,
    createdAt: document.created_at ?? document.createdAt ?? new Date().toISOString(),
    blob: file,
  };

  await (await database).put("offline-documents", savedDocument);
  return { document: savedDocument, persistent: await requestPersistentStorage() };
}

export async function cacheDocumentForOffline(document) {
  const blob = await readTravelDocument(document);
  const persistent = await requestPersistentStorage();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${document.title}.${document.mime_type === "application/pdf" ? "pdf" : document.mime_type?.split("/")[1] ?? "file"}`;
  link.rel = "noopener";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return persistent;
}

export async function deleteOfflineDocument(documentId) {
  await (await database).delete("offline-documents", documentId);
}

export async function uploadTravelDocument({ file, title, slotKey = null, userId }) {
  if (!supabase) throw new Error("Configurez Supabase avant d'importer des documents.");
  validateTravelDocument(file);
  const mimeType = getTravelDocumentMimeType(file);

  const { data: existing, error: lookupError } = slotKey
    ? await supabase.from("travel_documents").select("file_path").eq("slot_key", slotKey).maybeSingle()
    : { data: null, error: null };
  if (lookupError) throw new Error(lookupError.message);

  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "file";
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const row = {
    title: title.trim(),
    slot_key: slotKey,
    file_path: filePath,
    mime_type: mimeType,
    file_size: file.size,
    created_by: userId,
  };
  const result = slotKey
    ? await supabase.from("travel_documents").upsert(row, { onConflict: "slot_key" }).select("*").single()
    : await supabase.from("travel_documents").insert(row).select("*").single();

  if (result.error) {
    const { error: cleanupError } = await supabase.storage.from(bucket).remove([filePath]);
    if (cleanupError) throw new Error(`${result.error.message} Le fichier téléversé n'a pas pu être nettoyé : ${cleanupError.message}`);
    throw new Error(result.error.message);
  }

  if (existing?.file_path) {
    const { error: cleanupError } = await supabase.storage.from(bucket).remove([existing.file_path]);
    if (cleanupError) throw new Error(`Document remplacé, mais l'ancienne version n'a pas pu être supprimée : ${cleanupError.message}`);
  }
  return result.data;
}

export async function deleteTravelDocument(document) {
  if (!supabase) throw new Error("Configurez Supabase avant de supprimer des documents.");
  const { error: storageError } = await supabase.storage.from(bucket).remove([document.file_path]);
  if (storageError) throw new Error(storageError.message);

  const { error } = await supabase.from("travel_documents").delete().eq("id", document.id);
  if (error) throw new Error(error.message);
  await deleteOfflineDocument(document.id);
}
