/** Israeli phone number to international digits for wa.me (0501234567 -> 972501234567). */
export function toWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function whatsappHref(phone: string, text?: string) {
  const base = `https://wa.me/${toWhatsAppDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function mapsQueryHref(address: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address} ${city}`.trim())}`;
}

export function mapsEmbedSrc(address: string, city: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${address} ${city}`.trim())}&output=embed`;
}

/** Accepts "@handle" or a full URL and returns a full URL. */
export function socialUrl(platform: string, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  const base: Record<string, string> = {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/@",
    linkedin: "https://linkedin.com/in/",
    github: "https://github.com/",
  };
  return (base[platform] ?? "https://") + handle;
}

/** Adds https:// when the owner typed a bare address like "calendly.com/daniel". */
export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
