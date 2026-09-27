import { supabase } from "./supabaseClient";
import compressImage from "../utils/compressImage";

const photoBucket = "family-updates";
const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxUploadSize = 25 * 1024 * 1024;
const cacheKey = "dublin-v3:family-timeline";

export function getCachedFamilyUpdates() {
  try {
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function normalizeUpdate(row) {
  const imagePaths = row.image_paths?.length ? row.image_paths : row.image_path ? [row.image_path] : [];
  const photoUrls = imagePaths.map((path) => supabase.storage.from(photoBucket).getPublicUrl(path).data.publicUrl);
  return {
    ...row,
    imagePaths,
    photoUrls,
    photoUrl: photoUrls[0] ?? null,
  };
}

export async function getFamilyUpdates() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("family_updates")
    .select("id, travel_date, travel_time, title, description, image_path, image_paths, created_at")
    .order("travel_date", { ascending: true })
    .order("travel_time", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const updates = (data ?? []).map(normalizeUpdate);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(updates));
  } catch {
    // The public timeline remains available for this visit when local storage is unavailable.
  }
  return updates;
}

export async function publishFamilyUpdate({ travelDate, travelTime, title, description, photos = [], userId }) {
  if (!supabase) throw new Error("Configurez Supabase pour publier dans le journal de bord.");
  const cleanedTitle = title.trim();
  if (!cleanedTitle || cleanedTitle.length > 120) throw new Error("Le titre doit contenir entre 1 et 120 caractères.");

  if (photos.length > 8) throw new Error("Publication limitée à 8 photos par souvenir.");
  if (photos.some((photo) => !allowedPhotoTypes.has(photo.type))) {
    throw new Error("Les photos doivent être au format JPEG, PNG ou WebP.");
  }
  if (photos.some((photo) => photo.size > maxUploadSize)) {
    throw new Error("Une photo d'origine dépasse la limite de 12 Mo.");
  }

  const compressedPhotos = await Promise.all(
    photos.map((photo) => compressImage(photo)),
  );
  const imagePaths = [];
  try {
    for (const preparedPhoto of compressedPhotos) {
      const imagePath = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from(photoBucket).upload(imagePath, preparedPhoto, {
        contentType: preparedPhoto.type,
        upsert: false,
      });
      if (error) throw new Error(`Une photo n'a pas pu être importée : ${error.message}`);
      imagePaths.push(imagePath);
    }
  } catch (uploadError) {
    if (imagePaths.length) {
      const { error: cleanupError } = await supabase.storage.from(photoBucket).remove(imagePaths);
      if (cleanupError) throw new Error(`${uploadError.message} Les photos déjà importées n'ont pas pu être nettoyées : ${cleanupError.message}`);
    }
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("family_updates")
    .insert({
      travel_date: travelDate,
      travel_time: travelTime,
      title: cleanedTitle,
      description: description.trim(),
      image_path: imagePaths[0] ?? null,
      image_paths: imagePaths,
      created_by: userId,
    })
    .select("id, travel_date, travel_time, title, description, image_path, image_paths, created_at")
    .single();
  if (error) {
    if (imagePaths.length) {
      const { error: cleanupError } = await supabase.storage.from(photoBucket).remove(imagePaths);
      if (cleanupError) throw new Error(`${error.message} La photo importée n'a pas pu être nettoyée : ${cleanupError.message}`);
    }
    throw new Error(error.message);
  }
  return normalizeUpdate(data);
}

export async function removeFamilyUpdate(update) {
  if (!supabase) throw new Error("Configurez Supabase pour modifier le journal de bord.");
  const { error } = await supabase.from("family_updates").delete().eq("id", update.id);
  if (error) throw new Error(error.message);

  const imagePaths = update.image_paths?.length ? update.image_paths : update.image_path ? [update.image_path] : [];
  if (imagePaths.length) {
    const { error: photoError } = await supabase.storage.from(photoBucket).remove(imagePaths);
    if (photoError) throw new Error(`Publication supprimée, mais la photo n'a pas pu être supprimée : ${photoError.message}`);
  }
}
