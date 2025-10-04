"use client";

import { NetworkProvider } from "@/contexts/network-context";
import { ReactNode } from "react";

export function ClientWrapper({ children }: { children: ReactNode }) {
  return <NetworkProvider>{children}</NetworkProvider>;
}