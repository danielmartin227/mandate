// CCTP V2 attestation retrieval and destination mint.
//
// This half of a bridge is offchain by CCTP's design: Circle observes the burn,
// signs an attestation, and someone submits it on the destination chain. The
// BridgeRule contract does the burn itself; only this completion step is offchain,
// and it is permissionless (destinationCaller is zero), so anyone can finish it.
//
// Measured 2026-08-06: attestation available ~11 seconds after the Arc burn.
import { createPublicClient, createWalletClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { keeperAccount } from "../chain/arc-clients.js";

const ATTESTATION_API = "https://iris-api-sandbox.circle.com/v2/messages";
const ARC_DOMAIN = 26;

/// CCTP V2 MessageTransmitter, same address across EVM testnets.
export const MESSAGE_TRANSMITTER_V2 =
  "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const;

const MESSAGE_TRANSMITTER_ABI = [{
  type: "function", name: "receiveMessage", stateMutability: "nonpayable",
  inputs: [{ name: "message", type: "bytes" }, { name: "attestation", type: "bytes" }],
  outputs: [{ type: "bool" }],
}] as const;

export type Attestation = { message: `0x${string}`; attestation: `0x${string}` };

/// Poll Circle's sandbox API until the burn is attested.
export async function fetchAttestation(
  burnTxHash: string,
  timeoutMs = 20 * 60_000,
): Promise<Attestation | undefined> {
  const url = `${ATTESTATION_API}/${ARC_DOMAIN}?transactionHash=${burnTxHash}`;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const body: any = await res.json();
        const m = body?.messages?.[0];
        if (m?.status === "complete" && m.attestation && m.attestation !== "PENDING") {
          console.log(`  attested after ${Math.round((Date.now() - started) / 1000)}s`);
          return { message: m.message, attestation: m.attestation };
        }
      }
      // A 404 right after the burn is normal: Circle has not indexed it yet.
    } catch {
      // transient network failure, keep polling
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return undefined;
}

/// Submit the attestation on Base Sepolia to mint the bridged USDC.
export async function mintOnBaseSepolia(att: Attestation) {
  const account = keeperAccount();
  const pub = createPublicClient({ chain: baseSepolia, transport: http() });

  const ethBalance = await pub.getBalance({ address: account.address });
  console.log("  Base Sepolia ETH:", formatUnits(ethBalance, 18));
  if (ethBalance === 0n) {
    return { minted: false as const, reason: "no Base Sepolia ETH for gas" };
  }

  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });
  const hash = await wallet.writeContract({
    address: MESSAGE_TRANSMITTER_V2,
    abi: MESSAGE_TRANSMITTER_ABI,
    functionName: "receiveMessage",
    args: [att.message, att.attestation],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  return {
    minted: receipt.status === "success",
    hash,
    explorer: `https://sepolia.basescan.org/tx/${hash}`,
  };
}
