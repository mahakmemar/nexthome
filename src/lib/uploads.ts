import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_PHOTOS, isUploadName, uploadNameFromUrl } from "@/lib/photos";

// Server-only: where uploaded photos live on disk (outside /public, and gitignored).
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/** What the file's first bytes say it is. We never trust the name or the browser's type. */
export function detectImageType(buf: Buffer): "jpeg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

export async function saveUpload(name: string, data: Buffer) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), data, { flag: "wx" });
}

export async function readUpload(name: string) {
  if (!isUploadName(name)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

async function exists(name: string) {
  try {
    await access(path.join(UPLOAD_DIR, name));
    return true;
  } catch {
    return false;
  }
}

/** The photos on a new ad must be 1 to MAX_PHOTOS of our own uploads that really exist. */
export async function validatePhotoUrls(
  input: unknown,
): Promise<{ ok: true; photos: string[] } | { ok: false; error: string }> {
  if (!Array.isArray(input) || !input.every((u) => typeof u === "string")) {
    return { ok: false, error: "photos must be a list of uploaded photos" };
  }
  const photos = [...new Set(input as string[])];
  if (photos.length === 0) return { ok: false, error: "Add at least one photo" };
  if (photos.length > MAX_PHOTOS) return { ok: false, error: `You can add up to ${MAX_PHOTOS} photos` };

  for (const url of photos) {
    const name = uploadNameFromUrl(url);
    if (!name || !(await exists(name))) return { ok: false, error: "A photo wasn't uploaded properly" };
  }
  return { ok: true, photos };
}
