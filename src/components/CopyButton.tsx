"use client";

import { useState } from "react";

export function CopyButton({ text, label = "העתקת הכתובת" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <>
      <button type="button" onClick={copy} className="min-h-11 rounded-xl border border-gray-400 px-3 text-sm font-semibold hover:bg-gray-50">
        {copied ? "✓ הועתק" : label}
      </button>
      <span className="sr-only" role="status">{copied ? "הכתובת הועתקה" : ""}</span>
    </>
  );
}
