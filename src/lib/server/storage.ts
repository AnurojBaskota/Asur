import "server-only";
import path from "node:path";

// Uploaded media lives outside /public so it is served the same way in dev and
// production (`next start` only serves /public files that existed at build).
// Swap this module for S3/R2/Cloudinary when deploying to serverless hosting.
export const UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads");

export const IMAGE_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", magic: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
