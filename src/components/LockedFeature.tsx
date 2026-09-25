import type { ReactNode } from "react";
import { LockIcon } from "./ui/icons";

/**
 * Shows a Pro-only feature rather than hiding it - always visible, never
 * disabled/grayed, so Basic owners can see what they'd get instead of
 * discovering it never existed. Use the compact form (`inline`) for a
 * label like "מרכז פניות 🔒" and the full form for an explanatory block.
 */
export function LockedFeature({
  label,
  hint,
  inline,
  className,
}: {
  label: string;
  hint?: string;
  inline?: boolean;
  className?: string;
}) {
  if (inline) {
    return (
      <span className={className}>
        {label} <LockIcon className="inline align-[-2px] text-gray-500" />
      </span>
    );
  }
  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 font-semibold text-gray-900">
        {label}
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
          <LockIcon /> זמין ב-WEBG Pro
        </span>
      </p>
      {hint && <p className="mt-1 text-sm text-gray-600">{hint}</p>}
    </div>
  );
}

/** A short badge only, for overlaying on a card/thumbnail. */
export function LockedBadge({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-indigo-800 shadow">
      <LockIcon /> {children ?? "Pro"}
    </span>
  );
}
