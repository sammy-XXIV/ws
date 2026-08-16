import type { SweepableNft } from "./types";

// Placeholder data, used only as a fallback when no backend URL is configured.
export const mockNfts: SweepableNft[] = [
  { id: "1", collection: "Cash Cats", tokenId: "4821", bestOfferEth: 0.014 },
  { id: "2", collection: "Cash Cats", tokenId: "1190", bestOfferEth: 0.014 },
  { id: "3", collection: "Spritehood", tokenId: "77", bestOfferEth: 0.09 },
  { id: "4", collection: "HOODIES", tokenId: "2305", bestOfferEth: null },
  { id: "5", collection: "HOODIES", tokenId: "9981", bestOfferEth: null },
  { id: "6", collection: "Unnamed Drop #12", tokenId: "3", bestOfferEth: null },
];
