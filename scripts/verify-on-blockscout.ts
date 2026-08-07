// Blockscout (Arcscan) source verification from the same standard-json input
// solc-js already produced. Replaces `forge verify-contract`.
const BLOCKSCOUT_API = "https://testnet.arcscan.app/api/v2/smart-contracts";

export async function verifyContract(opts: {
  address: string;
  standardJsonInput: string;
  solcVersion: string;
  constructorArgs?: string; // ABI-encoded, without 0x
}): Promise<boolean> {
  // solc.version() looks like "0.8.36+commit.8a079791.Emscripten.clang";
  // Blockscout wants "v0.8.36+commit.8a079791".
  const compilerVersion = "v" + opts.solcVersion.replace(".Emscripten.clang", "");

  const form = new FormData();
  form.append("compiler_version", compilerVersion);
  form.append("license_type", "mit");
  if (opts.constructorArgs) {
    form.append("constructor_args", opts.constructorArgs);
  }
  form.append(
    "files[0]",
    new Blob([opts.standardJsonInput], { type: "application/json" }),
    "standard-input.json",
  );

  try {
    const res = await fetch(
      `${BLOCKSCOUT_API}/${opts.address}/verification/via/standard-input`,
      { method: "POST", body: form },
    );
    const text = await res.text();
    console.log(`  verification: HTTP ${res.status} ${text.slice(0, 200)}`);
    return res.ok;
  } catch (e: any) {
    console.log("  verification request failed:", e.message);
    return false;
  }
}

/// Poll until Blockscout reports the source as verified.
export async function waitForVerification(address: string, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${BLOCKSCOUT_API}/${address}`);
      if (res.ok) {
        const body: any = await res.json();
        if (body.is_verified) {
          console.log(`  source VERIFIED after ${Math.round((Date.now() - started) / 1000)}s`);
          return true;
        }
      }
    } catch {
      // transient, keep polling
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log("  not verified within timeout; check Arcscan manually");
  return false;
}
