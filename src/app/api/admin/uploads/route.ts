import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/server/session";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES, UPLOAD_DIR } from "@/lib/server/storage";

export async function POST(request: Request) {
  if (!(await getSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ error: "No files received." }, { status: 400 });

  await mkdir(UPLOAD_DIR, { recursive: true });
  const urls: string[] = [];

  for (const file of files) {
    const type = IMAGE_TYPES[file.type];
    if (!type) return Response.json({ error: `${file.name}: only JPG, PNG or WebP allowed.` }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: `${file.name}: larger than 5 MB.` }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    if (!type.magic(buf)) return Response.json({ error: `${file.name}: file contents are not a valid image.` }, { status: 400 });

    const name = `${randomUUID()}.${type.ext}`;
    await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), buf);
    urls.push(`/media/${name}`);
  }

  return Response.json({ urls });
}
