/** Joins class names, skipping empty ones. A plain module, so server components can use it too (ui.tsx is a client module). */
export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
