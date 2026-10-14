import { readFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_TYPES, UPLOAD_DIR } from "@/lib/server/storage";

const CONTENT_TYPES = Object.fromEntries(Object.entries(IMAGE_TYPES).map(([mime, t]) => [t.ext, mime]));

export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const name = parts.join("/");
  // Uploads are flat `<uuid>.<ext>` files — reject anything else (no traversal).
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[name.split(".").pop()!],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
