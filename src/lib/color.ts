/** Returns white or dark text, whichever has the higher contrast on the given background. */
export function readableOn(hex: string): "#ffffff" | "#111827" | "#000000" {
  const white = contrastRatio(hex, "#ffffff");
  if (white >= 4.5) return "#ffffff";
  if (contrastRatio(hex, "#111827") >= 4.5) return "#111827";
  // Mid-tones: neither soft option reaches 4.5, so take whichever extreme is better.
  return white >= contrastRatio(hex, "#000000") ? "#ffffff" : "#000000";
}

/** WCAG contrast ratio of the color against white. */
export function contrastWithWhite(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 21;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}

export const isHexColor = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

export const COLOR_SWATCHES = [
  { hex: "#2563eb", name: "כחול" },
  { hex: "#0f766e", name: "ירוק-כחול" },
  { hex: "#16a34a", name: "ירוק" },
  { hex: "#d97706", name: "כתום" },
  { hex: "#dc2626", name: "אדום" },
  { hex: "#be185d", name: "ורוד" },
  { hex: "#7c3aed", name: "סגול" },
  { hex: "#1f2937", name: "אפור כהה" },
  { hex: "#92400e", name: "חום" },
  { hex: "#0369a1", name: "תכלת כהה" },
];

/* ── Helpers used by templates to keep any brand color readable ── */

function toRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = parseInt(m ? m[1] : "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mixes `a` toward `b` by `t` (0 = a, 1 = b). */
export function mix(a: string, b: string, t: number): string {
  const [ra, rb] = [toRgb(a), toRgb(b)];
  return toHex(ra.map((v, i) => v + (rb[i] - v) * t));
}

/**
 * Nudges `color` toward black or white (whichever the background is far from)
 * until it reaches `min` contrast on `bg`. Returns the color unchanged if it is already fine.
 */
export function ensureContrast(color: string, bg: string, min = 4.5): string {
  if (contrastRatio(color, bg) >= min) return color;
  const pole = luminance(bg) > 0.5 ? "#000000" : "#ffffff";
  for (let t = 0.1; t <= 1.001; t += 0.1) {
    const c = mix(color, pole, t);
    if (contrastRatio(c, bg) >= min) return c;
  }
  return pole;
}
