"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <span>{shortAddress(address)}</span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  const injectedConnector = connectors[0];

  return (
    <button
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending || !injectedConnector}
    >
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
