import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Uploaded media goes to Supabase Storage when SUPABASE_URL + SUPABASE_SECRET_KEY
// are set (production). Without them (local dev) files are written to
// ./storage/uploads and served by the /media route.

export const UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads");

export const IMAGE_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", magic: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  // Accept the new "secret" key or the legacy service_role key.
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  return url && key ? { url, key, bucket } : null;
}

export const usingSupabaseStorage = () => supabaseConfig() !== null;

/** Store an already-validated image and return its public URL. */
export async function saveUpload(name: string, data: Buffer, contentType: string): Promise<string> {
  const sb = supabaseConfig();
  if (!sb) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), data);
    return `/media/${name}`;
  }

  const objectPath = `products/${name}`;
  const headers: Record<string, string> = {
    apikey: sb.key,
    "Content-Type": contentType,
    "Cache-Control": "max-age=31536000",
    "x-upsert": "false",
  };
  // Legacy service_role keys are JWTs and go in Authorization; new sb_secret_ keys only need `apikey`.
  if (sb.key.startsWith("eyJ")) headers.Authorization = `Bearer ${sb.key}`;

  const res = await fetch(`${sb.url}/storage/v1/object/${encodeURIComponent(sb.bucket)}/${objectPath}`, {
    method: "POST",
    headers,
    body: new Uint8Array(data),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Supabase upload failed", res.status, detail.slice(0, 300));
    throw new Error("Image storage rejected the upload. Check the bucket exists and the server key is correct.");
  }
  return `${sb.url}/storage/v1/object/public/${encodeURIComponent(sb.bucket)}/${objectPath}`;
}
