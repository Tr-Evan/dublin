import { supabase } from "./supabaseClient";

const photoBucket = "family-updates";
const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxUploadSize = 12 * 1024 * 1024;
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

async function prepareFamilyPhoto(file) {
  if (!allowedPhotoTypes.has(file.type)) throw new Error("La photo doit être au format JPEG, PNG ou WebP.");
  if (file.size > maxUploadSize) throw new Error("La photo d'origine ne peut pas dépasser 12 Mo.");

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1_600 / bitmap.width, 1_600 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer la photo sur cet appareil.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const jpeg = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
    if (!jpeg) throw new Error("Impossible de compresser la photo.");
    if (jpeg.size > 5 * 1024 * 1024) throw new Error("La photo compressée dépasse encore 5 Mo ; choisissez une autre image.");
    return new File([jpeg], `souvenir-${crypto.randomUUID()}.jpg`, { type: "image/jpeg" });
  } catch (imageError) {
    throw new Error(`Préparation de la photo impossible : ${imageError.message}`);
  } finally {
    bitmap?.close();
  }
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
  const imagePaths = [];
  try {
    for (const photo of photos) {
      const preparedPhoto = await prepareFamilyPhoto(photo);
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
