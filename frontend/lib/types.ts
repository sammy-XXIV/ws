export type SweepOrder = {
  orderHash: string;
  protocolAddress: string;
  parameters: unknown;
  signature: string;
  criteriaKind: "item" | "collection" | "trait";
};

export type SweepableNft = {
  id: string;
  collection: string;
  tokenId: string;
  contract: string;
  bestOfferEth: number | null;
  fulfillable: boolean;
  order: SweepOrder | null;
};
