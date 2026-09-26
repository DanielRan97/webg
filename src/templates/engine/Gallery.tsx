import { formatPrice } from "../shared/helpers";
import type { SiteData } from "@/types/site";
import type { GalleryLayout, TemplateTheme } from "./types";

/**
 * Column spans on a 6-column grid so the last row is always full:
 * 1 -> one wide, 2 -> halves, 3 -> thirds, 4 -> 2x2, 5 -> 3+2, 7 -> 3+2+2x2.
 */
const SPAN_CLASS: Record<number, string> = { 2: "md:col-span-2", 3: "md:col-span-3", 6: "md:col-span-6" };
function gallerySpans(n: number): number[] {
  if (n === 1) return [6];
  if (n === 2) return [3, 3];
  if (n === 4) return [3, 3, 3, 3];
  const rem = n % 3;
  if (rem === 0) return Array(n).fill(2);
  if (rem === 2) return [...Array(n - 2).fill(2), 3, 3];
  return [...Array(n - 4).fill(2), 3, 3, 3, 3];
}

type Props = { d: SiteData; t: TemplateTheme };
type Img = SiteData["gallery"][number];

const alt = (d: SiteData, i: number) => d.gallery[i].title || `${d.businessName} - תמונה ${i + 1}`;

/** Bottom-of-image caption for an optional title/price. Renders nothing when both are empty - a plain photo looks exactly as before. */
function Caption({ g }: { g: Img }) {
  if (!g.title && !g.price) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
      {g.title && <span className="truncate text-sm font-semibold">{g.title}</span>}
      {g.price && <span className="shrink-0 text-sm font-bold">{formatPrice(g.price)}</span>}
    </div>
  );
}

function Mosaic({ d, t }: Props) {
  const spans = gallerySpans(d.gallery.length);
  const odd = d.gallery.length % 2 === 1;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
      {d.gallery.map((g, i) => (
        <div key={g.url + i}
          className={`relative overflow-hidden ${t.media} ${SPAN_CLASS[spans[i]]} ${odd && i === d.gallery.length - 1 ? "col-span-2" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.url} alt={alt(d, i)} loading="lazy" className="h-44 w-full object-cover sm:h-56 md:h-64" />
          <Caption g={g} />
        </div>
      ))}
    </div>
  );
}

/** Framed portrait prints; ragged last rows stay centered. */
function Uniform({ d }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {d.gallery.map((g, i) => (
        <div key={g.url + i} className={`border border-t-line bg-t-surface p-2 ${d.gallery.length === 1 ? "w-full max-w-md" : "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.7rem)]"}`}>
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt={alt(d, i)} loading="lazy" className="aspect-[4/5] w-full object-cover" />
            <Caption g={g} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Natural proportions in flowing columns. */
function Masonry({ d }: Props) {
  return (
    <div className={`gap-3 ${d.gallery.length === 1 ? "columns-1" : "columns-2 md:columns-3"}`}>
      {d.gallery.map((g, i) => (
        <div key={g.url + i} className="relative mb-3 overflow-hidden break-inside-avoid">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.url} alt={alt(d, i)} loading="lazy" className="h-auto w-full" />
          <Caption g={g} />
        </div>
      ))}
    </div>
  );
}

/** Thick outlines, alternating proportions. */
function Chunky({ d }: Props) {
  const odd = d.gallery.length % 2 === 1;
  return (
    <div className="grid grid-cols-2 items-start gap-4">
      {d.gallery.map((g, i) => {
        const last = odd && i === d.gallery.length - 1;
        return (
          <div key={g.url + i}
            className={`relative overflow-hidden rounded-md border-[3px] border-black shadow-[4px_4px_0_0_#000] ${last ? "col-span-2 aspect-video" : i % 2 === 0 ? "aspect-square" : "aspect-[4/5]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt={alt(d, i)} loading="lazy" className="h-full w-full object-cover" />
            <Caption g={g} />
          </div>
        );
      })}
    </div>
  );
}

/** One large lead image with small ones beside it (needs 1 + 4k images), otherwise the standard mosaic. */
function Feature({ d, t }: Props) {
  const n = d.gallery.length;
  if (!(n > 1 && n % 4 === 1)) return <Mosaic d={d} t={t} />;
  return (
    <div className="grid auto-rows-[10rem] grid-cols-2 gap-2 md:auto-rows-[13rem] md:grid-cols-4">
      {d.gallery.map((g, i) => (
        <div key={g.url + i} className={`relative overflow-hidden ${t.media} ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.url} alt={alt(d, i)} loading="lazy" className="h-full w-full object-cover" />
          <Caption g={g} />
        </div>
      ))}
    </div>
  );
}

/** Editorial asymmetric grid: one wide lead image, the rest in taller portrait pairs, with a soft hover zoom. Used by premium templates. */
function Showcase({ d, t }: Props) {
  const n = d.gallery.length;
  if (n <= 2) {
    return (
      <div className={`grid gap-4 md:gap-5 ${n === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
        {d.gallery.map((g, i) => (
          <div key={g.url + i} className={`group relative overflow-hidden ${t.media} aspect-[16/10]`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt={alt(d, i)} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <Caption g={g} />
          </div>
        ))}
      </div>
    );
  }
  // A full-width lead banner, then the rest tiled with the same proven
  // span math as Mosaic - guaranteed to always fill complete rows, for any n.
  const lead = d.gallery[0];
  const rest = d.gallery.slice(1);
  const spans = gallerySpans(rest.length);
  return (
    <div className="space-y-4 md:space-y-5">
      <div className={`group relative overflow-hidden ${t.media} aspect-[16/9] md:aspect-[21/9]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lead.url} alt={alt(d, 0)} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <Caption g={lead} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6 md:gap-5">
        {rest.map((g, i) => (
          <div key={g.url + i} className={`group relative overflow-hidden ${t.media} ${SPAN_CLASS[spans[i]]} aspect-[4/5]`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt={alt(d, i + 1)} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <Caption g={g} />
          </div>
        ))}
      </div>
    </div>
  );
}

const LAYOUTS: Record<GalleryLayout, (p: Props) => React.JSX.Element> = {
  mosaic: Mosaic,
  uniform: Uniform,
  masonry: Masonry,
  bold: Chunky,
  feature: Feature,
  showcase: Showcase,
};

export function Gallery(p: Props) {
  const Layout = LAYOUTS[p.t.gallery];
  return <Layout {...p} />;
}
