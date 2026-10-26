import { NextResponse, type NextRequest } from "next/server";
import { completeCheckout, getGateway } from "@/server/billing";

/**
 * Where the payment page sends the owner after a successful payment (for HYP: the success URL set in the
 * HYP portal). A GET that changes state, so nothing in it is trusted: completeCheckout verifies the whole
 * query with the gateway, ties it to WEBG's own pending payment and applies it once. Needs no session -
 * the verified payment says which site it was for.
 */
export async function GET(req: NextRequest) {
  const home = new URL("/dashboard", req.url);
  const gateway = getGateway();
  if (!gateway) return NextResponse.redirect(home);

  // Exactly as received: HYP verifies the signature against the parameters in their original order.
  const rawQuery = req.nextUrl.search.replace(/^\?/, "");
  try {
    const outcome = await completeCheckout(rawQuery, gateway);
    if (!outcome.websiteId) {
      console.error("billing return rejected:", outcome.ok ? "" : outcome.reason);
      return NextResponse.redirect(new URL("/dashboard?payment=failed", req.url));
    }
    const target = new URL(`/sites/${outcome.websiteId}/billing`, req.url);
    target.searchParams.set("payment", outcome.ok ? "ok" : "failed");
    if (!outcome.ok) console.error("billing return rejected:", outcome.reason);
    return NextResponse.redirect(target);
  } catch (e) {
    console.error("billing return failed:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(new URL("/dashboard?payment=failed", req.url));
  }
}
