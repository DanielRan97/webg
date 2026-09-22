import { readLocalImage } from "@/lib/storage";

/** Dev-only route: serves files saved by the local storage adapter. In production, uploads go straight to R2's own public URL and never touch this route. */
export async function GET(_req: Request, ctx: RouteContext<"/api/files/[name]">) {
  const { name } = await ctx.params;
  const file = await readLocalImage(name);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
