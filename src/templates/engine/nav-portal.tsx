"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const NavPortalContext = createContext<HTMLDivElement | null>(null);

/**
 * Provides a portal target that stays *inside* the template's own themed
 * root - unlike `document.body`, a node here still inherits the page's
 * `dir="rtl"` and its `--t-*` CSS variables (colors are set via inline
 * style on that root, and custom properties only cascade through real DOM
 * ancestry, which a `document.body` portal would escape). Used by SiteNav's
 * "עוד" dropdown and mobile menu so they can render with `position: fixed`
 * (immune to any header clipping/overflow) while still looking themed.
 */
export function NavPortalProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return (
    <NavPortalContext.Provider value={node}>
      {children}
      <div ref={setNode} />
    </NavPortalContext.Provider>
  );
}

export function useNavPortalRoot() {
  return useContext(NavPortalContext);
}
