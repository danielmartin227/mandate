// Compile a Solidity file with solc-js. Validates the no-Foundry toolchain decision.
// Emits abi + bytecode, and the standard-json input needed for Blockscout verification.
import { readFileSync, writeFileSync } from "node:fs";
import solc from "solc";

export type Compiled = {
  abi: unknown[];
  bytecode: `0x${string}`;
  standardJsonInput: string;
  solcVersion: string;
};

export function compileContract(sourcePath: string, contractName: string): Compiled {
  const source = readFileSync(sourcePath, "utf8");
  const fileName = sourcePath.split(/[\\/]/).pop()!;

  const input = {
    language: "Solidity",
    sources: { [fileName]: { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris", // Arc: PREVRANDAO is 0, stay on a conservative target
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };

  const standardJsonInput = JSON.stringify(input);
  const output = JSON.parse(solc.compile(standardJsonInput));

  const errors = (output.errors ?? []).filter((e: any) => e.severity === "error");
  if (errors.length) {
    throw new Error("solc errors:\n" + errors.map((e: any) => e.formattedMessage).join("\n"));
  }
  for (const w of output.errors ?? []) {
    console.log("  solc warning:", w.formattedMessage?.trim().split("\n")[0]);
  }

  const artifact = output.contracts[fileName][contractName];
  return {
    abi: artifact.abi,
    bytecode: ("0x" + artifact.evm.bytecode.object) as `0x${string}`,
    standardJsonInput,
    solcVersion: solc.version(),
  };
}

// Run directly: compile the probe and report.
if (process.argv[1]?.endsWith("compile-with-solc.ts")) {
  const out = compileContract("./SpikeProbe.sol", "SpikeProbe");
  writeFileSync("./SpikeProbe.artifact.json", JSON.stringify(out, null, 2));
  console.log("solc version  ", out.solcVersion);
  console.log("abi entries   ", out.abi.length);
  console.log("bytecode bytes", (out.bytecode.length - 2) / 2);
  console.log("-> solc-js toolchain WORKS, no Foundry needed");
}
