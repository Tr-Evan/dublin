import { pubs, restaurants, visits } from "../data/itineraryData";
import { supabase } from "./supabaseClient";

const legacyPlaces = { visite: visits, food: restaurants, pub: pubs };
const cacheKey = (kind) => `dublin-v2:places:${kind}`;

function parseTransportDetails(value) {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function fromRow(row) {
  const imagePaths = row.image_paths?.length ? row.image_paths : row.image_path ? [row.image_path] : [];
  const imageUrls = imagePaths.map((path) => supabase.storage.from("place-covers").getPublicUrl(path).data.publicUrl);
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    category: row.category,
    description: row.description,
    address: row.address,
    openingHours: row.opening_hours,
    price: row.price,
    officialWebsite: row.official_website ?? "",
    bookingLink: row.booking_link ?? "",
    priceRange: row.price_range ?? "",
    transportDetails: parseTransportDetails(row.transport_details),
    distance: row.travel_time,
    travel: row.travel_time,
    mapQuery: row.map_query || row.name,
    imagePath: imagePaths[0] ?? null,
    imagePaths,
    imageUrls,
    imageUrl: imageUrls[0] ?? "",
    details: row.details ?? [],
    note: row.note,
    accent: row.accent,
  };
}

function toRow(place, kind) {
  const transportDetails = place.transportDetails;
  const hasTransportDetails = transportDetails && (
    transportDetails.mode
    || (transportDetails.duration != null && transportDetails.duration !== "")
    || transportDetails.route
  );

  return {
    id: place.id,
    kind,
    name: place.name,
    category: place.category ?? "",
    description: place.description ?? "",
    address: place.address ?? "",
    opening_hours: place.openingHours ?? "",
    price: place.price ?? "",
    official_website: place.officialWebsite || null,
    booking_link: place.bookingLink || null,
    price_range: place.priceRange || null,
    transport_details: hasTransportDetails ? transportDetails : null,
    travel_time: place.distance ?? place.travel ?? "",
    map_query: place.mapQuery ?? place.name,
    image_path: place.imagePaths?.[0] ?? place.imagePath ?? null,
    image_paths: place.imagePaths ?? (place.imagePath ? [place.imagePath] : []),
    details: place.details ?? [],
    note: place.note ?? "",
    accent: place.accent ?? "mint",
  };
}

export async function getPlaces(kind) {
  if (!supabase) return legacyPlaces[kind] ?? [];

  const { data, error } = await supabase.from("places").select("*").eq("kind", kind).order("name");
  if (error) throw new Error(error.message);

  const places = (data ?? []).map(fromRow);
  try {
    localStorage.setItem(cacheKey(kind), JSON.stringify(places));
  } catch {
    // The in-memory result remains usable when browser storage is unavailable.
  }
  return places;
}

export function getCachedPlaces(kind) {
  try {
    const cached = localStorage.getItem(cacheKey(kind));
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

export async function savePlace(place, kind) {
  if (!supabase) throw new Error("Configurez Supabase avant d'enregistrer une adresse.");
  const { data, error } = await supabase.from("places").upsert(toRow(place, kind)).select("*").single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function deletePlace(place) {
  if (!supabase) throw new Error("Configurez Supabase avant de supprimer une adresse.");

  const { error } = await supabase.from("places").delete().eq("id", place.id);
  if (error) throw new Error(error.message);

  const paths = place.imagePaths?.length ? place.imagePaths : place.imagePath ? [place.imagePath] : [];
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("place-covers").remove(paths);
    if (storageError) throw new Error(`Adresse supprimée, mais la photo n'a pas pu être supprimée : ${storageError.message}`);
  }
}

async function prepareCoverImage(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1_600 / bitmap.width, 1_200 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer la photo sur cet appareil.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) throw new Error("Impossible de convertir la photo de couverture.");
    return new File([blob], `couverture-${crypto.randomUUID()}.jpg`, { type: "image/jpeg" });
  } catch (imageError) {
    throw new Error(`Impossible de préparer la photo : ${imageError.message}`);
  } finally {
    bitmap?.close();
  }
}

export async function uploadPlaceImages(files) {
  if (!supabase) throw new Error("Configurez Supabase avant d'importer une photo.");
  if (!files.length) return [];
  if (files.length > 8) throw new Error("Import limité à 8 photos par lieu.");
  const uploadedPaths = [];
  try {
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) throw new Error(`« ${file.name} » dépasse la limite de 8 Mo.`);
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(`« ${file.name} » n'est pas au format JPEG, PNG ou WebP.`);
      const image = await prepareCoverImage(file);
      const path = `places/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("place-covers").upload(path, image, {
        contentType: image.type,
        upsert: false,
      });
      if (error) throw new Error(error.message);
      uploadedPaths.push(path);
    }
    return uploadedPaths;
  } catch (uploadError) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await supabase.storage.from("place-covers").remove(uploadedPaths);
      if (cleanupError) throw new Error(`${uploadError.message} Les fichiers déjà importés n'ont pas pu être nettoyés : ${cleanupError.message}`);
    }
    throw uploadError;
  }
}

export async function deletePlaceImages(paths) {
  if (!supabase) throw new Error("Configurez Supabase avant de supprimer une photo.");
  if (!paths.length) return;
  const { error } = await supabase.storage.from("place-covers").remove(paths);
  if (error) throw new Error(error.message);
}

export async function seedInitialPlaces() {
  if (!supabase) throw new Error("Configurez Supabase avant d'initialiser les adresses.");
  const rows = getStaticPlaceRows();
  const { error } = await supabase.from("places").upsert(rows, {
    onConflict: "id",
    ignoreDuplicates: true,
  });
  if (error) throw new Error(error.message);
}

function getStaticPlaceRows() {
  return [
    ...visits.map((place) => toRow(place, "visite")),
    ...restaurants.map((place) => toRow(place, "food")),
    ...pubs.map((place) => toRow(place, "pub")),
  ];
}

export async function syncItineraryMetadata() {
  if (!supabase) throw new Error("Configurez Supabase avant de synchroniser les adresses.");

  await seedInitialPlaces();
  const rows = getStaticPlaceRows();

  for (const row of rows) {
    const { data, error } = await supabase
      .from("places")
      .update({
        official_website: row.official_website,
        booking_link: row.booking_link,
        price_range: row.price_range,
        transport_details: row.transport_details,
      })
      .eq("id", row.id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(`Synchronisation de « ${row.name} » impossible : ${error.message}`);
    if (!data) throw new Error(`Le lieu « ${row.name} » n'a pas été trouvé après son initialisation.`);
  }

  return rows.length;
}
