"use client";

import { useState } from "react";

/** Fallback for when the async Clipboard API is missing or blocked (e.g. permissions policy, insecure context). */
function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  ta.style.pointerEvents = "none";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

type Status = "idle" | "copied" | "error";

export function CopyButton({ text, label = "העתקת הכתובת" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = legacyCopy(text);
    }
    setStatus(ok ? "copied" : "error");
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${status === "error" ? "border-red-300 text-red-700 hover:bg-red-50" : "border-gray-400 hover:bg-gray-50"}`}
      >
        {status === "copied" ? "✓ הועתק" : status === "error" ? "לא ניתן להעתיק" : label}
      </button>
      <span className="sr-only" role="status">
        {status === "copied" ? "הכתובת הועתקה" : status === "error" ? "ההעתקה נכשלה. אפשר לסמן ולהעתיק את הכתובת ידנית." : ""}
      </span>
    </>
  );
}
