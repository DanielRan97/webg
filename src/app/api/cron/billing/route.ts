import { NextResponse } from "next/server";
import { getGateway, runBilling } from "@/server/billing";

/**
 * The daily billing run (renewals, retries, endings, reminders - see server/billing.ts), called by Vercel
 * Cron (vercel.json). Vercel sends `Authorization: Bearer <CRON_SECRET>`; anything else is refused, so no
 * one else can trigger charges. Without a gateway it does nothing.
 */
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const gateway = getGateway();
  if (!gateway) return NextResponse.json({ skipped: "billing is off" });
  const report = await runBilling(gateway);
  console.log("billing run:", JSON.stringify(report));
  return NextResponse.json(report);
}
