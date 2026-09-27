import imageCompression from "browser-image-compression";

const maxInputSize = 25 * 1024 * 1024;
const maxOutputSize = 300_000;
const compressionOptions = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg",
};

export default async function compressImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error(`« ${file.name} » doit être au format JPEG, PNG ou WebP.`);
  }
  if (file.size > maxInputSize) {
    throw new Error(`« ${file.name} » dépasse la limite de 12 Mo.`);
  }

  try {
    let compressed = await imageCompression(file, compressionOptions);
    if (compressed.size > maxOutputSize) {
      compressed = await imageCompression(file, {
        ...compressionOptions,
        maxSizeMB: maxOutputSize / (1024 * 1024),
      });
    }
    if (compressed.size > maxOutputSize) {
      throw new Error("La photo reste supérieure à 300 Ko après compression.");
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
