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

export type BestOffer = {
  priceEth: number;
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
    return { priceEth };
  } catch {
    // No active offer (404) or transient error — treat as unsellable rather than failing the whole scan.
    return null;
  }
}
