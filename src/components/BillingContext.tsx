"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Whether billing is on (a payment gateway is configured - decided on the server, see lib/payments). */
const BillingContext = createContext(false);

export function BillingProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <BillingContext.Provider value={enabled}>{children}</BillingContext.Provider>;
}

export const useBillingEnabled = () => useContext(BillingContext);
