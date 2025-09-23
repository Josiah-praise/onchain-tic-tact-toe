"use client";

import { useNetwork, NetworkType } from "@/contexts/network-context";

export function NetworkSelector() {
  const { networkType, setNetworkType } = useNetwork();

  const handleNetworkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNetworkType(event.target.value as NetworkType);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="network-select" className="text-sm text-gray-300">
        Network:
      </label>
      <select
        id="network-select"
        value={networkType}
        onChange={handleNetworkChange}
        className="rounded bg-gray-700 px-3 py-1 text-sm text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
      </select>
    </div>
  );
}