// Watches for incoming USDC using Arc's EIP-7708 system emitter.
//
// The Arc-specific trick: one filter on the system emitter catches BOTH native
// and ERC-20 payments, because the emitter logs every USDC movement regardless
// of which interface moved it. On a normal EVM chain you cannot see a native
// transfer in a log filter at all.
//
// Values in these logs are 18 decimals and are used for DISPLAY ONLY. Payout
// amounts always come from the contract's own 6-decimal accounting.
import { parseAbiItem } from "viem";
import { wsClient, publicClient } from "../chain/arc-clients.js";
import { SYSTEM_EMITTER } from "../chain/arc-constants.js";

export const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export type IncomingPayment = {
  to: `0x${string}`;
  from: `0x${string}`;
  /// 18 decimals, display only.
  value: bigint;
  blockNumber: bigint;
  txHash: `0x${string}`;
};

export type WatchHandle = { stop: () => void };

/// Subscribe over WSS. Verified working with address + topic filters (spike S4).
export function watchIncomingPayments(
  addresses: `0x${string}`[],
  onPayment: (payment: IncomingPayment) => void,
  onError?: (e: Error) => void,
): WatchHandle {
  const client = wsClient();
  const unsubscribes = addresses.map((address) =>
    client.watchEvent({
      address: SYSTEM_EMITTER,
      event: TRANSFER_EVENT,
      args: { to: address },
      poll: false, // force eth_subscribe
      onLogs: (logs) => {
        for (const log of logs) {
          onPayment({
            to: log.args.to as `0x${string}`,
            from: log.args.from as `0x${string}`,
            value: log.args.value as bigint,
            blockNumber: log.blockNumber!,
            txHash: log.transactionHash!,
          });
        }
      },
      onError: (e) => onError?.(e),
    }),
  );
  return { stop: () => unsubscribes.forEach((u) => u()) };
}

/// HTTP polling fallback. Also verified in the spike, kept as a real option
/// rather than a hypothetical one: if a provider drops eth_subscribe, this is
/// a one-line swap at the call site.
export function pollIncomingPayments(
  addresses: `0x${string}`[],
  onPayment: (payment: IncomingPayment) => void,
  intervalMs = 4000,
  onError?: (e: Error) => void,
): WatchHandle {
  const client = publicClient();
  // Exclusive lower bound: every block after this one has been scanned. Set on
  // the first tick so the keeper only ever acts on payments that arrive while it
  // is running, and advanced ONLY over ranges actually scanned. Arc produces
  // several blocks a second, so a range that silently fails to advance loses
  // payments; it must never be reset to a window near the head.
  let scannedThrough: bigint | undefined;
  let stopped = false;

  /// Arc RPC caps a getLogs range, and a stalled keeper can build a long backlog.
  /// Walk it in chunks rather than asking for the whole gap in one call.
  const MAX_RANGE = 500n;

  const scan = async (from: bigint, to: bigint) => {
    for (const address of addresses) {
      const logs = await client.getLogs({
        address: SYSTEM_EMITTER,
        event: TRANSFER_EVENT,
        args: { to: address },
        fromBlock: from,
        toBlock: to,
      });
      for (const log of logs) {
        onPayment({
          to: log.args.to as `0x${string}`,
          from: log.args.from as `0x${string}`,
          value: log.args.value as bigint,
          blockNumber: log.blockNumber!,
          txHash: log.transactionHash!,
        });
      }
    }
  };

  const tick = async () => {
    if (stopped) return;
    try {
      const head = await client.getBlockNumber();
      let cursor: bigint = scannedThrough ?? head;
      scannedThrough = cursor;
      // Advance a chunk at a time, committing progress after each chunk so a
      // failure part way through resumes from there rather than rescanning.
      while (!stopped && cursor < head) {
        const from = cursor + 1n;
        const end = from + MAX_RANGE - 1n;
        const to = end < head ? end : head;
        await scan(from, to);
        cursor = to;
        scannedThrough = cursor;
      }
    } catch (e: any) {
      // Surfaced, not swallowed: a poller that fails quietly looks exactly like
      // a chain with no payments on it, which is the worst failure mode here.
      const error = e instanceof Error ? e : new Error(String(e));
      if (onError) onError(error);
      else console.error("poll error:", error.message);
    }
    if (!stopped) setTimeout(tick, intervalMs);
  };
  void tick();

  return { stop: () => { stopped = true; } };
}
