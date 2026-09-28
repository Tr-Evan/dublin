import imageCompression from "browser-image-compression";

const maxInputSize = 25 * 1024 * 1024;
const maxOutputSize = 300_000;
const mimeTypeByExtension = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const compressionOptions = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg",
};

export default async function compressImage(file) {
  const extension = file.name?.split(".").pop()?.toLowerCase();
  const normalizedType = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ? file.type
    : (!file.type || file.type === "application/octet-stream") ? mimeTypeByExtension[extension] : null;
  if (!normalizedType) {
    throw new Error(`« ${file.name} » doit être au format JPEG, PNG ou WebP.`);
  }
  if (file.size > maxInputSize) {
    throw new Error(`« ${file.name} » dépasse la limite de 25 Mo.`);
  }

  try {
    const normalizedFile = file.type === normalizedType
      ? file
      : new File([file], file.name, { type: normalizedType, lastModified: file.lastModified });
    let compressed = await imageCompression(normalizedFile, compressionOptions);
    if (compressed.size > maxOutputSize) {
      compressed = await imageCompression(normalizedFile, {
        ...compressionOptions,
        maxSizeMB: maxOutputSize / (1024 * 1024),
      });
    }
    if (compressed.size > maxOutputSize) {
      throw new Error("L'image reste supérieure à 300 Ko après compression.");
    }

    const result = new File(
      [compressed],
      `souvenir-${crypto.randomUUID()}.jpg`,
      { type: "image/jpeg", lastModified: Date.now() },
    );
    console.info(
      "Taille originale:",
      `${(file.size / 1024).toFixed(1)} Ko`,
      "Taille compressée:",
      `${(result.size / 1024).toFixed(1)} Ko`,
    );
    return result;
  } catch (compressionError) {
    throw new Error(`Compression de « ${file.name} » impossible : ${compressionError.message}`);
  }
}
