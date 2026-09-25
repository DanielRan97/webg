"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./ui/ui";
import { PlanComparison } from "./PlanComparison";

/** "מה כולל Pro?" - same <dialog>/showModal() pattern as DeleteSiteDialog. */
export function PlanComparisonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,36rem)] rounded-3xl p-6 shadow-2xl backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-xl font-bold text-gray-900">מה כולל Pro?</h2>
      <p className="mt-1 text-sm text-gray-600">אפשר להתחיל עם Basic ולשדרג בכל שלב - שום מידע לא נמחק.</p>
      <div className="mt-4">
        <PlanComparison />
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" autoFocus onClick={onClose}>סגירה</Button>
      </div>
    </dialog>
  );
}
