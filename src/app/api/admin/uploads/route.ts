import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/server/session";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES, saveUpload } from "@/lib/server/storage";

export async function POST(request: Request) {
  if (!(await getSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ error: "No files received." }, { status: 400 });
  if (files.length > 12) return Response.json({ error: "Upload at most 12 images at once." }, { status: 400 });

  const urls: string[] = [];
  for (const file of files) {
    const type = IMAGE_TYPES[file.type];
    if (!type) return Response.json({ error: `${file.name}: only JPG, PNG or WebP allowed.` }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: `${file.name}: larger than 5 MB.` }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    if (!type.magic(buf)) return Response.json({ error: `${file.name}: file contents are not a valid image.` }, { status: 400 });

    try {
      urls.push(await saveUpload(`${randomUUID()}.${type.ext}`, buf, file.type));
    } catch (e) {
      return Response.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 502 });
    }
  }

  return Response.json({ urls });
}
