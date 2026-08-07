// CCTP V2 constants for Arc testnet. Every value verified in the spike (test S5).
// See plans/reports/spike-260806-1542-arc-cctp-emitter.md.

/// TokenMessenger V2 on Arc testnet.
export const TOKEN_MESSENGER_V2 =
  "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as const;

/// MessageTransmitter V2 on Base Sepolia (destination side).
export const MESSAGE_TRANSMITTER_V2 =
  "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const;

/// Arc's CCTP domain number.
export const ARC_DOMAIN = 26;

/// Base Sepolia's CCTP domain number.
export const BASE_SEPOLIA_DOMAIN = 6;

/// Attestation API (sandbox).
export const ATTESTATION_API =
  "https://iris-api-sandbox.circle.com/v2/messages" as const;

/// Standard finality threshold. Arc has no Fast Transfer.
export const STANDARD_FINALITY = 2000;

/// ABI for TokenMessengerV2.depositForBurn (used by deploy script checks).
export const TOKEN_MESSENGER_ABI = [
  {
    type: "function",
    name: "depositForBurn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
    ],
    outputs: [],
  },
] as const;

/// ABI for MessageTransmitterV2.receiveMessage (destination side mint).
export const MESSAGE_TRANSMITTER_ABI = [
  {
    type: "function",
    name: "receiveMessage",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;
