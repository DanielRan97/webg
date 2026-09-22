import { readableOn } from "@/lib/color";

/** Uploaded logo, or a simple placeholder: first letter of the business on the brand color. */
export function Logo({
  logoUrl,
  name,
  color,
  size = 40,
  decorative,
}: {
  logoUrl: string;
  name: string;
  color: string;
  size?: number;
  /** True when the business name is shown right next to the logo, so screen readers skip it. */
  decorative?: boolean;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={decorative ? "" : `הלוגו של ${name}`} width={size} height={size} className="rounded-lg object-contain" style={{ width: size, height: size }} />;
  }
  const letter = [...name.trim()][0]?.toUpperCase() ?? "•";
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{ width: size, height: size, background: color, color: readableOn(color), fontSize: size * 0.5 }}
    >
      {letter}
    </span>
  );
}
