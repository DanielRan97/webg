import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, saveImage } from "@/lib/storage";

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  if (!(file.type in ALLOWED_TYPES)) {
    return NextResponse.json({ error: "אפשר להעלות רק תמונות (PNG, JPG, WEBP, GIF)" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "התמונה גדולה מדי (עד 5MB)" }, { status: 400 });
  }
  const url = await saveImage(Buffer.from(await file.arrayBuffer()), file.type);
  return NextResponse.json({ url });
}
