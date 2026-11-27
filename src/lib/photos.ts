// Rules for the photos on an ad. Shared by the browser and the server.

export const MAX_PHOTOS = 5;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB per photo, before we shrink it
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Uploaded photos are stored under a random name, so a name can never point at another file.
const UPLOAD_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export function isUploadName(name: string) {
  return UPLOAD_NAME.test(name);
}

/** "/uploads/<name>" -> "<name>", or null if the URL isn't one of our uploads. */
export function uploadNameFromUrl(url: string) {
  const match = /^\/uploads\/([^/?#]+)$/.exec(url);
  return match && isUploadName(match[1]) ? match[1] : null;
}
