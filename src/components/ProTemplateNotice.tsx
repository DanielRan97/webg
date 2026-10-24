"use client";

import Link from "next/link";
import { useState } from "react";
import { PLANS } from "@/lib/business";
import { PlanComparisonModal } from "./PlanComparisonModal";
import { Button } from "./ui/ui";

const PRO_PRICE = PLANS.find((p) => p.id === "PRO")?.price;

/**
 * Shown in place of the publish button when a Basic site is built with a Pro template
 * (see needsProToPublish): a calm explanation and the two ways forward, never a red error.
 */
export function ProTemplateNotice({ siteId, compact = false }: { siteId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-4 text-start text-sm text-brand-900">
      <p className="font-bold">האתר בנוי בעיצוב של מסלול Pro</p>
      <p>
        כדי לפרסם אותו בעיצוב הזה צריך מסלול Pro{PRO_PRICE && <> (₪{PRO_PRICE} לחודש)</>}. אפשר גם לבחור עיצוב רגיל בלשונית
        ״עיצוב״ ולפרסם מיד. שום דבר מהתוכן לא נמחק.
      </p>
      <div className={compact ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
        <Link href={`/sites/${siteId}/edit?tab=branding`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ink-200 bg-white px-4 font-semibold text-ink-900 shadow-sm hover:bg-ink-50">
          בחירת עיצוב רגיל
        </Link>
        <Button type="button" variant="secondary" className="min-h-10 px-4 text-sm" onClick={() => setOpen(true)}>מה כולל Pro?</Button>
      </div>
      <PlanComparisonModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
