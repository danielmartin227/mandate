// Compile, deploy, and verify a rule template. Shared by the plain CLI deploy
// and the compile-then-confirm flow, so both take the identical path onto chain.
import { encodeAbiParameters, formatUnits } from "viem";
import { publicClient, walletClient, keeperAccount } from "../chain/arc-clients.js";
import { explorerAddress, explorerTx } from "../chain/arc-constants.js";
import { compileContract } from "../../scripts/compile-contracts.js";
import { verifyContract, waitForVerification } from "../../scripts/verify-on-blockscout.js";
import { saveRule, type DeployedRule } from "./rule-store.js";
import { getTemplate } from "./rule-templates.js";

export type DeployOptions = {
  /// Positional template arguments, e.g. ["0xabc...", "1000"] for SplitRule.
  templateArgs: string[];
  /// The sentence this rule was compiled from, recorded for provenance.
  sourceSentence?: string;
  log?: (line: string) => void;
};

export async function deployRuleTemplate(
  template: string,
  opts: DeployOptions,
): Promise<DeployedRule> {
  const log = opts.log ?? console.log;
  const spec = getTemplate(template);

  const account = keeperAccount();
  const pub = publicClient();
  const wallet = walletClient();

  const balance = await pub.getBalance({ address: account.address });
  log(`deployer ${account.address} ${formatUnits(balance, 18)} USDC`);
  if (balance === 0n) throw new Error("deployer unfunded, use faucet.circle.com");

  log(`compiling ${template}`);
  const { abi, bytecode, standardJsonInput, solcVersion } = compileContract(template);

  // owner = deployer for the demo; a real treasurer would pass their own address.
  const { args, params } = spec.buildArgs(opts.templateArgs, account.address);
  log(`deploying ${template}`);
  for (const [k, v] of Object.entries(params)) log(`  ${k} = ${v}`);

  const hash = await wallet.deployContract({ abi: abi as any, bytecode, args: args as any });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("deployment reverted");
  const address = receipt.contractAddress!;

  log(`  tx       ${explorerTx(hash)}`);
  log(`  contract ${explorerAddress(address)}`);
  log(`  gasUsed  ${receipt.gasUsed}`);

  const rule: DeployedRule = {
    template,
    address,
    deployTx: hash,
    params,
    abi,
    deployedAt: new Date().toISOString(),
    sourceSentence: opts.sourceSentence,
  };
  saveRule(rule);

  // Constructor args must be appended for Blockscout to match the bytecode.
  const constructorArgs = encodeAbiParameters(spec.constructorTypes, args as any).slice(2);

  log("verifying source");
  await verifyContract({ address, standardJsonInput, solcVersion, constructorArgs });
  await waitForVerification(address);

  return rule;
}
