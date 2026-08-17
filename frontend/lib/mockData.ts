import type { SweepableNft } from "./types";

// Placeholder data, used only as a fallback when no backend URL is configured.
// Mock entries are never fulfillable since they have no real order behind them.
export const mockNfts: SweepableNft[] = [
  {
    id: "1",
    collection: "Cash Cats",
    tokenId: "4821",
    contract: "0x0000000000000000000000000000000000dead",
    bestOfferEth: 0.014,
    fulfillable: false,
    order: null,
  },
  {
    id: "2",
    collection: "Cash Cats",
    tokenId: "1190",
    contract: "0x0000000000000000000000000000000000dead",
    bestOfferEth: 0.014,
    fulfillable: false,
    order: null,
  },
  {
    id: "3",
    collection: "Spritehood",
    tokenId: "77",
    contract: "0x0000000000000000000000000000000000dead",
    bestOfferEth: 0.09,
    fulfillable: false,
    order: null,
  },
  {
    id: "4",
    collection: "HOODIES",
    tokenId: "2305",
    contract: "0x0000000000000000000000000000000000dead",
    bestOfferEth: null,
    fulfillable: false,
    order: null,
  },
  {
    id: "5",
    collection: "HOODIES",
    tokenId: "9981",
    contract: "0x0000000000000000000000000000000000dead",
    bestOfferEth: null,
    fulfillable: false,
    order: null,
  },
  {
    id: "6",
    collection: "Unnamed Drop #12",
    tokenId: "3",
    contract: "0x0000000000000000000000000000000000dead",
    bestOfferEth: null,
    fulfillable: false,
    order: null,
  },
];
