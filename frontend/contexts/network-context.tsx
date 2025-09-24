"use client";

import { STACKS_TESTNET, StacksNetwork } from "@stacks/network";
import { createContext, useContext, ReactNode } from "react";

export type NetworkType = "testnet";

interface NetworkContextType {
  networkType: NetworkType;
  network: StacksNetwork;
  getApiUrl: () => string;
  getExplorerUrl: () => string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const networkType: NetworkType = "testnet";
  const network = STACKS_TESTNET;

  const getApiUrl = () => {
    return "https://api.testnet.hiro.so";
  };

  const getExplorerUrl = () => {
    return "https://explorer.hiro.so";
  };

  return (
    <NetworkContext.Provider
      value={{
        networkType,
        network,
        getApiUrl,
        getExplorerUrl,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}