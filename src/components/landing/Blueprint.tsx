/**
 * The home hero's backdrop: the faint outline of a website - top bar, hero block, a button, three cards -
 * drawing itself in once on load, as if a site is being assembled behind the copy. Two slow, soft lights
 * sit under it. Purely decorative; under reduced motion it simply appears (globals.css).
 */
export function Blueprint() {
  const line = "webg-draw fill-none stroke-white/[0.09]";
  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="webg-drift absolute -top-48 end-[-12%] h-[38rem] w-[38rem] rounded-full bg-brand-600/30 blur-3xl" />
      <div className="webg-drift absolute bottom-[-30%] start-[-10%] h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" style={{ animationDelay: "-9s" }} />
      <svg
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_60%_65%_at_28%_58%,black_20%,transparent_75%)]"
        strokeWidth="1.25"
      >
        <g transform="translate(0 90)">
        {/* Top bar: logo, name, menu */}
        <rect className={line} style={delay(0)} pathLength={1} x="60" y="40" width="1080" height="60" rx="16" />
        <circle className={line} style={delay(150)} pathLength={1} cx="1100" cy="70" r="14" />
        <rect className={line} style={delay(200)} pathLength={1} x="930" y="62" width="140" height="16" rx="8" />
        <rect className={line} style={delay(260)} pathLength={1} x="100" y="62" width="70" height="16" rx="8" />
        <rect className={line} style={delay(300)} pathLength={1} x="190" y="62" width="70" height="16" rx="8" />
        <rect className={line} style={delay(340)} pathLength={1} x="280" y="62" width="70" height="16" rx="8" />
        {/* Hero block with headline lines and a button */}
        <rect className={line} style={delay(400)} pathLength={1} x="60" y="140" width="1080" height="320" rx="28" />
        <rect className={line} style={delay(600)} pathLength={1} x="640" y="210" width="440" height="34" rx="17" />
        <rect className={line} style={delay(680)} pathLength={1} x="760" y="264" width="320" height="34" rx="17" />
        <rect className={line} style={delay(760)} pathLength={1} x="860" y="340" width="220" height="56" rx="28" />
        {/* Three cards */}
        <rect className={line} style={delay(900)} pathLength={1} x="60" y="500" width="340" height="180" rx="24" />
        <rect className={line} style={delay(1000)} pathLength={1} x="430" y="500" width="340" height="180" rx="24" />
        <rect className={line} style={delay(1100)} pathLength={1} x="800" y="500" width="340" height="180" rx="24" />
        </g>
      </svg>
    </div>
  );
}
