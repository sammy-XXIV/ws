const OPENSEA_BASE = "https://api.opensea.io/api/v2";
const CHAIN = "robinhood";

function apiKey(): string {
  const key = process.env.OPENSEA_API_KEY;
  if (!key) throw new Error("OPENSEA_API_KEY is not set");
  return key;
}

async function openseaGet(path: string) {
  const res = await fetch(`${OPENSEA_BASE}${path}`, {
    headers: { "x-api-key": apiKey() },
  });
  if (!res.ok) {
    throw new Error(`OpenSea ${path} -> ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export type OpenSeaNft = {
  collection: string;
  contract: string;
  identifier: string;
  name: string | null;
  image_url: string | null;
};

export async function getAccountNfts(address: string): Promise<OpenSeaNft[]> {
  const nfts: OpenSeaNft[] = [];
  let next: string | undefined;
  do {
    const query = new URLSearchParams({ limit: "200" });
    if (next) query.set("next", next);
    const data = await openseaGet(
      `/chain/${CHAIN}/account/${address}/nfts?${query.toString()}`
    );
    nfts.push(...(data.nfts ?? []));
    next = data.next || undefined;
  } while (next);
  return nfts;
}

// Seaport ItemType enum (see @opensea/seaport-js/lib/constants.d.ts)
const ERC721_WITH_CRITERIA = 4;
const ERC1155_WITH_CRITERIA = 5;
const NFT_ITEM_TYPES = new Set([2, 3, ERC721_WITH_CRITERIA, ERC1155_WITH_CRITERIA]);

export type BestOffer = {
  priceEth: number;
  orderHash: string;
  protocolAddress: string;
  parameters: unknown;
  signature: string;
  /**
   * "item"       — consideration targets this exact token, no criteria needed.
   * "collection" — criteria item with a wildcard (root 0) proof, i.e. a plain
   *                collection-wide offer. Fulfillable with an empty proof.
   * "trait"      — criteria item with a real merkle root (trait-restricted
   *                offer). We don't have the proof for this, so it's excluded
   *                from what the sweeper will attempt to fulfill.
   */
  criteriaKind: "item" | "collection" | "trait";
} | null;

export async function getBestOffer(
  collectionSlug: string,
  tokenId: string
): Promise<BestOffer> {
  try {
    const data = await openseaGet(
      `/offers/collection/${collectionSlug}/nfts/${tokenId}/best`
    );
    const price = data?.price;
    if (!price?.value || !price?.decimals) return null;
    const priceEth = Number(price.value) / 10 ** price.decimals;

    const parameters = data?.protocol_data?.parameters;
    const signature = data?.protocol_data?.signature;
    if (!parameters || !signature) return null;

    const nftItem = (parameters.consideration ?? []).find((item: { itemType: number }) =>
      NFT_ITEM_TYPES.has(item.itemType)
    );
    if (!nftItem) return null;

    let criteriaKind: "item" | "collection" | "trait" = "item";
    if (
      nftItem.itemType === ERC721_WITH_CRITERIA ||
      nftItem.itemType === ERC1155_WITH_CRITERIA
    ) {
      criteriaKind = nftItem.identifierOrCriteria === "0" ? "collection" : "trait";
    }

    return {
      priceEth,
      orderHash: data.order_hash,
      protocolAddress: data.protocol_address,
      parameters,
      signature,
      criteriaKind,
    };
  } catch {
    // No active offer (404) or transient error — treat as unsellable rather than failing the whole scan.
    return null;
  }
}
