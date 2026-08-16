"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "./ConnectButton";
import { mockNfts } from "@/lib/mockData";
import type { SweepableNft } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Home() {
  const { isConnected, address } = useAccount();
  const [scanned, setScanned] = useState<SweepableNft[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellable = useMemo(
    () => (scanned ?? []).filter((n) => n.bestOfferEth !== null),
    [scanned]
  );
  const unsellable = useMemo(
    () => (scanned ?? []).filter((n) => n.bestOfferEth === null),
    [scanned]
  );

  const totalEth = useMemo(() => {
    if (!scanned) return 0;
    return scanned
      .filter((n) => selected.has(n.id) && n.bestOfferEth !== null)
      .reduce((sum, n) => sum + (n.bestOfferEth ?? 0), 0);
  }, [scanned, selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllSellable() {
    setSelected(new Set(sellable.map((n) => n.id)));
  }

  async function scan() {
    setError(null);
    setSelected(new Set());

    if (!BACKEND_URL) {
      setScanned(mockNfts);
      return;
    }
    if (!address) return;

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/scan/${address}`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setScanned(data.nfts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setScanned(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "780px",
        margin: "0 auto",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #000",
          paddingBottom: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.1rem", fontWeight: "normal" }}>
          NFT Sweeper — Robinhood Chain
        </h1>
        <ConnectButton />
      </header>

      {isConnected && (
        <>
          <button onClick={scan} disabled={loading}>
            {loading
              ? "Scanning..."
              : BACKEND_URL
              ? "Scan Wallet"
              : "Scan Wallet (mock data — no backend configured)"}
          </button>

          {error && <p>Error: {error}</p>}

          {scanned && (
            <>
              <section>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>Sellable ({sellable.length})</span>
                  <button onClick={selectAllSellable} disabled={sellable.length === 0}>
                    Select all sellable
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Collection</th>
                      <th>Token ID</th>
                      <th>Best offer (ETH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellable.map((n) => (
                      <tr key={n.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(n.id)}
                            onChange={() => toggle(n.id)}
                          />
                        </td>
                        <td>{n.collection}</td>
                        <td>{n.tokenId}</td>
                        <td>{n.bestOfferEth}</td>
                      </tr>
                    ))}
                    {sellable.length === 0 && (
                      <tr>
                        <td colSpan={4}>None found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section>
                <div style={{ marginBottom: "0.5rem" }}>
                  Not sellable — no open offer ({unsellable.length})
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Collection</th>
                      <th>Token ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unsellable.map((n) => (
                      <tr key={n.id}>
                        <td>{n.collection}</td>
                        <td>{n.tokenId}</td>
                      </tr>
                    ))}
                    {unsellable.length === 0 && (
                      <tr>
                        <td colSpan={2}>None.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <footer
                style={{
                  borderTop: "1px solid #000",
                  paddingTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  Selected: {selected.size} · Est. proceeds: {totalEth.toFixed(4)} ETH
                </span>
                <button disabled={selected.size === 0} title="Not wired up yet">
                  Sweep Selected
                </button>
              </footer>
            </>
          )}
        </>
      )}
    </main>
  );
}
