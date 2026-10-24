import { cx } from "./ui/ui";

/** What the wizard adds after its first step - real step names, so the promise matches the product. */
const NEXT = ["עיצוב וצבעים", "שירותים ומחירים", "גלריית תמונות", "שעות פתיחה", "המלצות", "קביעת תור"];

/**
 * "This is only the start": shown under an early preview (the home page demo, the wizard's first step)
 * so owners don't mistake a hero-only preview for the whole site they'll get.
 */
export function ComingNext({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div className={cx("rounded-xl border p-3 text-start", dark ? "border-white/10 bg-white/5" : "border-ink-200 bg-white")}>
      <p className={cx("text-xs font-semibold", dark ? "text-ink-200" : "text-ink-800")}>זו רק ההתחלה. בשלבים הבאים אפשר להוסיף:</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {NEXT.map((item) => (
          <li
            key={item}
            className={cx(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              dark ? "border-white/15 text-ink-300" : "border-ink-200 bg-ink-50 text-ink-700",
            )}
          >
            <span aria-hidden className={dark ? "text-cyan-300" : "text-brand-600"}>+ </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
