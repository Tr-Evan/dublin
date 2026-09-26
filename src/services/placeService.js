import { pubs, restaurants, visits } from "../data/itineraryData";
import { supabase } from "./supabaseClient";

const legacyPlaces = { visite: visits, food: restaurants, pub: pubs };
const cacheKey = (kind) => `dublin-v2:places:${kind}`;

function fromRow(row) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    category: row.category,
    description: row.description,
    address: row.address,
    openingHours: row.opening_hours,
    price: row.price,
    distance: row.travel_time,
    travel: row.travel_time,
    mapQuery: row.map_query || row.name,
    imagePath: row.image_path,
    imageUrl: row.image_path
      ? supabase.storage.from("place-covers").getPublicUrl(row.image_path).data.publicUrl
      : "",
    details: row.details ?? [],
    note: row.note,
    accent: row.accent,
  };
}

function toRow(place, kind) {
  return {
    id: place.id,
    kind,
    name: place.name,
    category: place.category ?? "",
    description: place.description ?? "",
    address: place.address ?? "",
    opening_hours: place.openingHours ?? "",
    price: place.price ?? "",
    travel_time: place.distance ?? place.travel ?? "",
    map_query: place.mapQuery ?? place.name,
    image_path: place.imagePath ?? null,
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

  if (place.imagePath) {
    const { error: storageError } = await supabase.storage.from("place-covers").remove([place.imagePath]);
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

export async function uploadPlaceCover(file) {
  if (!supabase) throw new Error("Configurez Supabase avant d'importer une photo.");
  const cover = await prepareCoverImage(file);
  const path = `covers/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("place-covers").upload(path, cover, {
    contentType: cover.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function deletePlaceCover(path) {
  if (!supabase) throw new Error("Configurez Supabase avant de supprimer une photo.");
  const { error } = await supabase.storage.from("place-covers").remove([path]);
  if (error) throw new Error(error.message);
}

export async function seedInitialPlaces() {
  if (!supabase) throw new Error("Configurez Supabase avant d'initialiser les adresses.");
  const rows = [
    ...visits.map((place) => toRow(place, "visite")),
    ...restaurants.map((place) => toRow(place, "food")),
    ...pubs.map((place) => toRow(place, "pub")),
  ];
  const { error } = await supabase.from("places").upsert(rows, {
    onConflict: "id",
    ignoreDuplicates: true,
  });
  if (error) throw new Error(error.message);
}
