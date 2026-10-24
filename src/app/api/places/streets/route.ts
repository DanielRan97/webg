import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getStreets } from "@/lib/places";

/** Streets of one city, by its CBS code (`?city=4000`). Signed-in owners only, like /api/places/cities. */
export async function GET(request: NextRequest) {
  if (!(await getCurrentUser())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const city = request.nextUrl.searchParams.get("city") ?? "";
  if (!/^\d{1,5}$/.test(city)) return Response.json({ error: "bad city" }, { status: 400 });
  const streets = await getStreets(Number(city));
  return Response.json({ streets }, { headers: { "Cache-Control": "private, max-age=86400" } });
}
