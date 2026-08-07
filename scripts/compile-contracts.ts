// Solidity compilation via solc-js. No Foundry: one Node toolchain for the whole
// project, and Blockscout verification works from the same standard-json input.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import solc from "solc";

export type CompiledContract = {
  contractName: string;
  abi: unknown[];
  bytecode: `0x${string}`;
  standardJsonInput: string;
  solcVersion: string;
};

const ARTIFACTS_DIR = "artifacts";

export function compileContract(contractName: string): CompiledContract {
  const fileName = `${contractName}.sol`;
  const source = readFileSync(`contracts/${fileName}`, "utf8");

  const input = {
    language: "Solidity",
    sources: { [fileName]: { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // Arc reports PREVRANDAO as 0; stay on a conservative EVM target.
      evmVersion: "paris",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };

  const standardJsonInput = JSON.stringify(input);
  const output = JSON.parse(solc.compile(standardJsonInput));

  const errors = (output.errors ?? []).filter((e: any) => e.severity === "error");
  if (errors.length) {
    throw new Error(
      `solc failed for ${contractName}:\n` +
        errors.map((e: any) => e.formattedMessage).join("\n"),
    );
  }
  for (const w of output.errors ?? []) {
    console.log("  warning:", w.formattedMessage?.trim().split("\n")[0]);
  }

  const artifact = output.contracts[fileName][contractName];
  const compiled: CompiledContract = {
    contractName,
    abi: artifact.abi,
    bytecode: ("0x" + artifact.evm.bytecode.object) as `0x${string}`,
    standardJsonInput,
    solcVersion: solc.version(),
  };

  if (!existsSync(ARTIFACTS_DIR)) mkdirSync(ARTIFACTS_DIR);
  writeFileSync(
    `${ARTIFACTS_DIR}/${contractName}.json`,
    JSON.stringify(compiled, null, 2),
  );
  return compiled;
}

export function loadArtifact(contractName: string): CompiledContract {
  return JSON.parse(readFileSync(`${ARTIFACTS_DIR}/${contractName}.json`, "utf8"));
}

// Run directly to compile everything.
if (process.argv[1]?.endsWith("compile-contracts.ts")) {
  const targets = process.argv.slice(2);
  const contracts = targets.length ? targets : ["SplitRule"];
  for (const name of contracts) {
    const c = compileContract(name);
    console.log(
      `${name}: ${c.abi.length} abi entries, ${(c.bytecode.length - 2) / 2} bytes, solc ${c.solcVersion.split("+")[0]}`,
    );
  }
}
