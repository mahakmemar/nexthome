import { isUploadName } from "@/lib/photos";
import { readUpload } from "@/lib/uploads";

// Serves an uploaded photo. Only names we generated are accepted, so nothing else
// on disk can be reached through this URL.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!isUploadName(name)) return new Response("Not found", { status: 404 });

  const data = await readUpload(name);
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
      // Names are random and files never change, so browsers can keep them for good.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
