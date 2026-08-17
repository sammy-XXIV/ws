"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "./ConnectButton";
import { mockNfts } from "@/lib/mockData";
import type { SweepableNft } from "@/lib/types";
import { sweepNfts } from "@/lib/sweep";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Home() {
  const { isConnected, address } = useAccount();
  const [scanned, setScanned] = useState<SweepableNft[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [sweepStatus, setSweepStatus] = useState<string | null>(null);
  const [sweepTxHash, setSweepTxHash] = useState<string | null>(null);

  const sellable = useMemo(
    () => (scanned ?? []).filter((n) => n.bestOfferEth !== null),
    [scanned]
  );
  const unsellable = useMemo(
    () => (scanned ?? []).filter((n) => n.bestOfferEth === null),
    [scanned]
  );
  const unfulfillable = useMemo(
    () => sellable.filter((n) => !n.fulfillable),
    [sellable]
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
    setSelected(new Set(sellable.filter((n) => n.fulfillable).map((n) => n.id)));
  }

  async function sweep() {
    if (!address || !scanned) return;
    const toSweep = scanned.filter((n) => selected.has(n.id) && n.fulfillable);
    if (toSweep.length === 0) return;

    setSweeping(true);
    setSweepTxHash(null);
    setSweepStatus(null);
    setError(null);
    try {
      const hash = await sweepNfts(toSweep, address, (msg) => setSweepStatus(msg));
      setSweepTxHash(hash);
      setSweepStatus("Done.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sweep failed");
    } finally {
      setSweeping(false);
    }
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellable.map((n) => (
                      <tr key={n.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(n.id)}
                            disabled={!n.fulfillable}
                            onChange={() => toggle(n.id)}
                          />
                        </td>
                        <td>{n.collection}</td>
                        <td>{n.tokenId}</td>
                        <td>{n.bestOfferEth}</td>
                        <td>{!n.fulfillable && "trait-restricted offer — unsupported"}</td>
                      </tr>
                    ))}
                    {sellable.length === 0 && (
                      <tr>
                        <td colSpan={5}>None found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {unfulfillable.length > 0 && (
                  <p>
                    {unfulfillable.length} offer(s) are trait-restricted and can&apos;t be
                    swept by this tool yet — excluded above from selection.
                  </p>
                )}
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
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    Selected: {selected.size} · Est. proceeds: {totalEth.toFixed(4)} ETH
                  </span>
                  <button onClick={sweep} disabled={selected.size === 0 || sweeping}>
                    {sweeping ? "Sweeping..." : "Sweep Selected"}
                  </button>
                </div>
                {sweepStatus && <p>{sweepStatus}</p>}
                {sweepTxHash && (
                  <p>
                    Tx:{" "}
                    <a
                      href={`https://robinhoodchain.blockscout.com/tx/${sweepTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {sweepTxHash}
                    </a>
                  </p>
                )}
              </footer>
            </>
          )}
        </>
      )}
    </main>
  );
}
