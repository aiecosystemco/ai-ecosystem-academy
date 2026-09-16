const MAX_EDGE = 1200;
const MAX_CHARS = 360000;
const AVATAR_EDGE = 480;
const AVATAR_CHARS = 120000;
export const VIDEO_MAX_BYTES = 420_000;

async function compressTo(file: File, maxEdge: number, maxChars: number): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (JPG, PNG, WebP).");
  }
  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  let quality = 0.72;
  let data = canvas.toDataURL("image/jpeg", quality);
  while (data.length > maxChars && quality > 0.4) {
    quality -= 0.12;
    data = canvas.toDataURL("image/jpeg", quality);
  }
  if (data.length > maxChars) {
    throw new Error("That image is still too large. Try a smaller crop.");
  }
  return data;
}

export async function compressImageFile(file: File): Promise<string> {
  return compressTo(file, MAX_EDGE, MAX_CHARS);
}

export async function compressAvatar(file: File): Promise<string> {
  return compressTo(file, AVATAR_EDGE, AVATAR_CHARS);
}

export async function readClassVideo(file: File): Promise<string> {
  if (!file.type.startsWith("video/")) {
    throw new Error("Choose a short video (MP4 or WebM).");
  }
  if (file.size > VIDEO_MAX_BYTES) {
    throw new Error("That clip is too large. Use a short video under 400 KB, or post a link as a resource.");
  }
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that video."));
    };
    reader.onerror = () => reject(new Error("Could not read that video."));
    reader.readAsDataURL(file);
  });
  if (!data.startsWith("data:video/") || data.length < 32) {
    throw new Error("That video could not be used.");
  }
  if (data.length > 620_000) {
    throw new Error("That clip is still too large. Post a shorter video or a link as a resource.");
  }
  return data;
}
