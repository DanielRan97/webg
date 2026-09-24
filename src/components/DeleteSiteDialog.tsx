"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button, inputClass } from "./ui/ui";

/**
 * Delete confirmation, deliberately stronger than the shared ConfirmDialog:
 * deleting a site is the only truly irreversible action in the app, so it
 * requires typing the exact business name rather than a single click.
 */
export function DeleteSiteDialog({
  open,
  businessName,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  businessName: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const inputId = useId();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const match = typed.trim() === businessName.trim();

  function cancel() {
    setTyped("");
    onCancel();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        cancel();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-3xl p-6 shadow-2xl backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-xl font-bold text-red-800">מחיקת האתר לצמיתות</h2>
      <p className="mt-2 text-gray-700">מחיקת האתר תמחק את האתר, התמונות והמידע שלו לצמיתות. הפעולה בלתי הפיכה.</p>
      <div className="mt-4 space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-900">
          כדי לאשר, הקלידו את שם העסק: <span className="font-bold">{businessName}</span>
        </label>
        <input
          id={inputId}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className={inputClass}
          autoComplete="off"
          aria-describedby={`${inputId}-hint`}
        />
        <p id={`${inputId}-hint`} className="text-sm text-gray-600">ההקלדה חייבת להיות זהה לשם העסק בדיוק.</p>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" autoFocus onClick={cancel}>ביטול</Button>
        <Button variant="danger" disabled={!match} loading={pending} onClick={onConfirm}>מחיקת האתר לצמיתות</Button>
      </div>
    </dialog>
  );
}
