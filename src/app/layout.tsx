import type { Metadata } from "next";
import { Assistant, Frank_Ruhl_Libre, Heebo, Rubik, Secular_One } from "next/font/google";
import { appUrl } from "@/lib/env";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

// Extra fonts give the website templates their own typography. They are only downloaded when a page uses them.
const frank = Frank_Ruhl_Libre({ variable: "--font-frank", subsets: ["hebrew", "latin"], display: "swap", preload: false });
const assistant = Assistant({ variable: "--font-assistant", subsets: ["hebrew", "latin"], display: "swap", preload: false });
const rubik = Rubik({ variable: "--font-rubik", subsets: ["hebrew", "latin"], display: "swap", preload: false });
const secular = Secular_One({ variable: "--font-secular", subsets: ["hebrew", "latin"], weight: "400", display: "swap", preload: false });

export const metadata: Metadata = {
  // Gives every relative URL in page metadata (og:image, canonical...) a correct absolute origin in production.
  metadataBase: new URL(appUrl()),
  title: { default: "WEBG - האתר של העסק שלך, בכמה קליקים", template: "%s | WEBG" },
  description: "ממלאים כמה פרטים על העסק ומקבלים אתר מוכן. בלי לדעת כלום על בניית אתרים.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frank.variable} ${assistant.variable} ${rubik.variable} ${secular.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-heebo)]">{children}</body>
    </html>
  );
}
