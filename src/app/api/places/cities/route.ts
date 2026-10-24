import { getCurrentUser } from "@/lib/session";
import { getPlaces } from "@/lib/places";

/** Israeli cities and areas for the editor's pickers (see lib/places.ts). Signed-in owners only: it's an editor helper, not a public API. */
export async function GET() {
  if (!(await getCurrentUser())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const places = await getPlaces();
  return Response.json(places, { headers: { "Cache-Control": "private, max-age=86400" } });
}
