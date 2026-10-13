/** The WEBG logo: a cobalt tile with the wordmark beside it. `tone="dark"` is for dark backgrounds. */
export function WebgMark({
  size = "md",
  suffix,
  tone = "light",
}: {
  size?: "sm" | "md";
  suffix?: string;
  tone?: "light" | "dark";
}) {
  const s = { sm: { tile: "h-6 w-6 text-[13px]", word: "text-lg" }, md: { tile: "h-7 w-7 text-sm", word: "text-xl" } }[size];
  return (
    <span dir="ltr" className="inline-flex items-center gap-2">
      <span aria-hidden className={`grid place-items-center rounded-lg bg-brand-600 font-bold text-white ${s.tile}`}>W</span>
      <span className={`font-bold tracking-tight ${tone === "dark" ? "text-white" : "text-ink-900"} ${s.word}`}>WEBG</span>
      {suffix && <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-xs font-semibold text-ink-600">{suffix}</span>}
    </span>
  );
}
