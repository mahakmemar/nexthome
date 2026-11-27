import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES } from "@/lib/photos";
import { detectImageType, saveUpload } from "@/lib/uploads";

// Accepts one photo and stores a cleaned-up copy. Every upload is decoded and
// re-encoded, which:
//  - proves it is a real image (not a script renamed to .jpg),
//  - applies the camera's rotation and then drops ALL metadata, including the GPS
//    location phones put in photos, which must never be published on a public ad,
//  - shrinks it to at most 1600 px so pages stay fast.
export async function POST(req: NextRequest) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "That photo is too big. Use one under 5 MB." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Choose a photo to upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a photo to upload" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That photo is too big. Use one under 5 MB." }, { status: 413 });
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(input)) {
    return NextResponse.json({ error: "Use a JPEG, PNG or WebP photo" }, { status: 415 });
  }

  let output: Buffer;
  try {
    output = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate() // apply the camera's orientation, then metadata is dropped by default
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "We couldn't read that image" }, { status: 422 });
  }

  const name = `${randomUUID()}.webp`;
  await saveUpload(name, output);
  return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
}
