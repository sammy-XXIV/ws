import { Seaport } from "@opensea/seaport-js";
import { BrowserProvider } from "ethers";
import type { OrderComponents } from "@opensea/seaport-js/lib/types";
import type { TransactionResponse } from "ethers";
import type { SweepableNft } from "./types";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
  }
}

export type SweepProgress = (message: string) => void;

export async function sweepNfts(
  nfts: SweepableNft[],
  accountAddress: string,
  onProgress: SweepProgress
): Promise<string> {
  if (!window.ethereum) throw new Error("No injected wallet found");

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  // Cast: TS resolves ethers' ESM/CJS type declarations differently between
  // this file and seaport-js's bundled .d.ts, so structurally-identical
  // classes (single deduped `ethers` install, confirmed via `npm ls`) get
  // treated as nominally distinct. Runtime is unaffected.
  const seaport = new Seaport(signer as unknown as ConstructorParameters<typeof Seaport>[0]);

  const fulfillOrderDetails = nfts.map((nft) => {
    if (!nft.order) throw new Error(`${nft.collection} #${nft.tokenId} has no order`);
    return {
      order: {
        parameters: nft.order.parameters as OrderComponents,
        signature: nft.order.signature,
      },
      // Collection-wide offers use a wildcard criteria root (proof-less);
      // item-specific offers need no criteria at all. Trait-restricted
      // offers are filtered out server-side before this ever runs.
      considerationCriteria:
        nft.order.criteriaKind === "collection"
          ? [{ identifier: nft.tokenId, proof: [] }]
          : undefined,
    };
  });

  onProgress(`Preparing to fulfill ${fulfillOrderDetails.length} offer(s)...`);

  const useCase = await seaport.fulfillOrders({
    fulfillOrderDetails,
    accountAddress,
  });

  const approvalCount = useCase.actions.filter((a) => a.type === "approval").length;
  if (approvalCount > 0) {
    onProgress(
      `${approvalCount} one-time collection approval(s) needed first (separate transactions)...`
    );
  }

  onProgress("Submitting the sale transaction...");
  // The declared return type here is loosely `ContractTransaction`, but the
  // library's own implementation (usecase.js) resolves this by calling
  // `.transact()`, which is typed and documented elsewhere in this package
  // as returning an ethers `TransactionResponse` (has `.hash` and `.wait()`).
  const tx = (await useCase.executeAllActions()) as unknown as TransactionResponse;
  onProgress(`Submitted (${tx.hash}). Waiting for confirmation...`);
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}
