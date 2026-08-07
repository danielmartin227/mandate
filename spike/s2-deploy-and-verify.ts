// S2: deploy a contract to Arc with viem (no Foundry) and verify it on Arcscan.
// Needs a funded wallet: gas is paid in USDC.
import { createPublicClient, createWalletClient, http, formatUnits } from "viem";
import { writeFileSync } from "node:fs";
import { arcTestnet, demoAccount } from "./arc-config.js";
import { compileContract } from "./compile-with-solc.js";

const account = demoAccount();
const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

const balance = await publicClient.getBalance({ address: account.address });
console.log("deployer", account.address, "balance", formatUnits(balance, 18), "USDC");
if (balance === 0n) {
  console.log("UNFUNDED. Fund from faucet.circle.com then rerun.");
  process.exit(1);
}

const { abi, bytecode, standardJsonInput, solcVersion } = compileContract(
  "./SpikeProbe.sol",
  "SpikeProbe",
);

console.log("deploying...");
const hash = await walletClient.deployContract({ abi: abi as any, bytecode });
const receipt = await publicClient.waitForTransactionReceipt({ hash });
const address = receipt.contractAddress!;

console.log("tx      ", hash);
console.log("contract", address);
console.log("gasUsed ", receipt.gasUsed);
console.log("explorer", `https://testnet.arcscan.app/address/${address}`);

writeFileSync(
  "./deployed-probe.json",
  JSON.stringify({ address, hash, abi, solcVersion }, null, 2),
);

// Blockscout standard-json verification. If the API shape differs, fall back to the
// Arcscan UI: paste standardJsonInput and the compiler version below.
console.log("\nattempting Blockscout verification...");
try {
  const form = new FormData();
  form.append("compiler_version", "v" + solcVersion.replace(".Emscripten.clang", ""));
  form.append("license_type", "mit");
  form.append(
    "files[0]",
    new Blob([standardJsonInput], { type: "application/json" }),
    "standard-input.json",
  );
  const res = await fetch(
    `https://testnet.arcscan.app/api/v2/smart-contracts/${address}/verification/via/standard-input`,
    { method: "POST", body: form },
  );
  console.log("verification response", res.status, (await res.text()).slice(0, 300));
} catch (e: any) {
  console.log("verification API failed:", e.message);
  console.log("FALLBACK: verify manually in the Arcscan UI (standard-json input saved).");
}
writeFileSync("./SpikeProbe.standard-input.json", standardJsonInput);
