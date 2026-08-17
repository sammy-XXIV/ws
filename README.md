# ws — NFT Sweeper (Robinhood Chain)

Scans a wallet for NFTs on [Robinhood Chain](https://docs.robinhood.com/chain/) that have an open OpenSea offer, and sells all of them in a single batched transaction instead of accepting offers one by one.

Live: https://frontend-production-56c3.up.railway.app

## How it works

- **Scan** — the backend fetches every NFT a wallet holds on Robinhood Chain, then checks OpenSea for the best offer on each one.
- **Sweep** — selected NFTs are sold in one transaction using Seaport's native batch-fulfillment (`fulfillAvailableOrders`, via [`seaport-js`](https://github.com/ProjectOpenSea/seaport-js)), rather than OpenSea's own UI which only accepts offers one at a time.
- Offers that require a Merkle proof to fulfill (trait-restricted collection offers) are detected and excluded — only item-specific and plain collection-wide offers are swept.
- If a collection has never been approved to Seaport before, a one-time `setApprovalForAll` transaction runs first (unavoidable, standard ERC-721/1155 behavior). The sale itself — however many NFTs are selected — is one transaction.

## Structure

```
backend/   Express API — proxies OpenSea (keeps the API key server-side)
frontend/  Next.js UI — wallet connect, scan, sweep
```

## Running locally

**Backend**
```
cd backend
cp .env.example .env   # fill in OPENSEA_API_KEY
npm install
npm run dev             # http://localhost:8787
```

**Frontend**
```
cd frontend
npm install
npm run dev              # http://localhost:3000
```
Set `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local` to point at the backend (defaults to `http://localhost:8787`). Without a backend configured, the UI falls back to mock data.

## Known limitations

- Trait-restricted collection offers aren't fulfillable by this tool (see above).
- No liquidity source beyond OpenSea — Robinhood Chain currently has no NFTX/Sudoswap-style instant-sell pools, so an NFT with zero open offers has no buyer, period.
- Unaudited. Moves real funds/NFTs via the connected wallet — use at your own risk.
