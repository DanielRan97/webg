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

const alt = (d: SiteData, i: number) => `${d.businessName} - תמונה ${i + 1}`;

function Mosaic({ d, t }: Props) {
  const spans = gallerySpans(d.gallery.length);
  const odd = d.gallery.length % 2 === 1;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
      {d.gallery.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url + i} src={url} alt={alt(d, i)} loading="lazy"
          className={`h-44 w-full object-cover sm:h-56 md:h-64 ${t.media} ${SPAN_CLASS[spans[i]]} ${odd && i === d.gallery.length - 1 ? "col-span-2" : ""}`} />
      ))}
    </div>
  );
}

/** Framed portrait prints; ragged last rows stay centered. */
function Uniform({ d }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {d.gallery.map((url, i) => (
        <div key={url + i} className={`border border-t-line bg-t-surface p-2 ${d.gallery.length === 1 ? "w-full max-w-md" : "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.7rem)]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt(d, i)} loading="lazy" className="aspect-[4/5] w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

/** Natural proportions in flowing columns. */
function Masonry({ d }: Props) {
  return (
    <div className={`gap-3 ${d.gallery.length === 1 ? "columns-1" : "columns-2 md:columns-3"}`}>
      {d.gallery.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url + i} src={url} alt={alt(d, i)} loading="lazy" className="mb-3 h-auto w-full break-inside-avoid" />
      ))}
    </div>
  );
}

/** Thick outlines, alternating proportions. */
function Chunky({ d }: Props) {
  const odd = d.gallery.length % 2 === 1;
  return (
    <div className="grid grid-cols-2 items-start gap-4">
      {d.gallery.map((url, i) => {
        const last = odd && i === d.gallery.length - 1;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url + i} src={url} alt={alt(d, i)} loading="lazy"
            className={`w-full rounded-md border-[3px] border-black object-cover shadow-[4px_4px_0_0_#000] ${last ? "col-span-2 aspect-video" : i % 2 === 0 ? "aspect-square" : "aspect-[4/5]"}`} />
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
      {d.gallery.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url + i} src={url} alt={alt(d, i)} loading="lazy"
          className={`h-full w-full object-cover ${t.media} ${i === 0 ? "col-span-2 row-span-2" : ""}`} />
      ))}
    </div>
  );
}

const LAYOUTS: Record<GalleryLayout, (p: Props) => React.JSX.Element> = {
  mosaic: Mosaic,
  uniform: Uniform,
  masonry: Masonry,
  bold: Chunky,
  feature: Feature,
};

export function Gallery(p: Props) {
  const Layout = LAYOUTS[p.t.gallery];
  return <Layout {...p} />;
}
