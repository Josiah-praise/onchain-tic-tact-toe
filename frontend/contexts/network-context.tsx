"use client";

import { STACKS_MAINNET, STACKS_TESTNET, StacksNetwork } from "@stacks/network";
import { createContext, useContext, useState, ReactNode } from "react";

export type NetworkType = "mainnet" | "testnet";

interface NetworkContextType {
  networkType: NetworkType;
  network: StacksNetwork;
  setNetworkType: (type: NetworkType) => void;
  getApiUrl: () => string;
  getExplorerUrl: () => string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkType, setNetworkType] = useState<NetworkType>("testnet");

  const network = networkType === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;

  const getApiUrl = () => {
    return networkType === "mainnet"
      ? "https://api.hiro.so"
      : "https://api.testnet.hiro.so";
  };

  const getExplorerUrl = () => {
    return networkType === "mainnet"
      ? "https://explorer.hiro.so"
      : "https://explorer.hiro.so";
  };

  return (
    <NetworkContext.Provider
      value={{
        networkType,
        network,
        setNetworkType,
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