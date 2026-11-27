import sharp from "sharp";

// Test photos made on the fly, so no binary files live in the repo.

export async function pngPhoto(color = "#c87a3c", size = 64) {
  return sharp({ create: { width: size, height: size, channels: 3, background: color } }).png().toBuffer();
}

/** A JPEG carrying a GPS position in its metadata, like a phone photo. */
export async function jpegWithGps() {
  return sharp({ create: { width: 64, height: 64, channels: 3, background: "#3c7ac8" } })
    .withExif({
      IFD0: { Make: "TestPhone", Model: "E2E" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "49/1 16/1 57/1", GPSLongitudeRef: "W", GPSLongitude: "123/1 7/1 14/1" },
    })
    .jpeg()
    .toBuffer();
}

/** Random noise does not compress, so this PNG really is over 5 MB. */
export async function pngOver5MB() {
  const size = 1400;
  const pixels = Buffer.alloc(size * size * 3);
  for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 2654435761) >>> 24;
  return sharp(pixels, { raw: { width: size, height: size, channels: 3 } }).png({ compressionLevel: 0 }).toBuffer();
}
