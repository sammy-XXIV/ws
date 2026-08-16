import "dotenv/config";
import express from "express";
import cors from "cors";
import { getAccountNfts, getBestOffer } from "./opensea";

const app = express();
const PORT = process.env.PORT ?? 8787;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: FRONTEND_ORIGIN }));

const CONCURRENCY = 5;

async function withOffers<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

app.get("/api/scan/:address", async (req, res) => {
  const { address } = req.params;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  try {
    const nfts = await getAccountNfts(address);
    const offers = await withOffers(nfts, (nft) =>
      getBestOffer(nft.collection, nft.identifier)
    );

    const results = nfts.map((nft, i) => ({
      id: `${nft.contract}:${nft.identifier}`,
      collection: nft.collection,
      tokenId: nft.identifier,
      contract: nft.contract,
      bestOfferEth: offers[i]?.priceEth ?? null,
    }));

    res.json({ nfts: results });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch from OpenSea" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
});
