import { STATUS_INFO } from "@/lib/status";
import type { DisplayState } from "@/lib/subscription";
import { CheckCircleIcon, DraftIcon, PauseCircleIcon } from "./ui/icons";

const ICONS: Record<DisplayState, typeof DraftIcon> = {
  DRAFT: DraftIcon,
  PUBLISHED: CheckCircleIcon,
  SUBSCRIPTION_INACTIVE: PauseCircleIcon,
};

/** Compact icon+text status pill - never relies on color alone. */
export function StatusBadge({ state }: { state: DisplayState }) {
  const info = STATUS_INFO[state];
  const Icon = ICONS[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${info.cls}`}>
      <Icon width={13} height={13} />
      {info.label}
    </span>
  );
}
