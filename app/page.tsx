"use client";

import { useState, useEffect, useCallback } from "react";

type CompileResult =
  | { kind: "refusal"; reason: string; sentence: string; model: string }
  | {
      kind: "compiled";
      template: string;
      readback: string;
      sentence: string;
      model: string;
      deployArgs: string[];
      params: Record<string, string | number>;
    };

type DeployedRule = {
  template: string;
  address: string;
  deployTx: string;
  params: Record<string, string | number>;
  deployedAt: string;
  sourceSentence?: string;
};

type Execution = {
  ruleAddress: string;
  template: string;
  outcome: string;
  timestamp: string;
  txHash?: string;
};

export default function MandatePage() {
  const [sentence, setSentence] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [rules, setRules] = useState<DeployedRule[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    try {
      const res = await fetch("/api/rules");
      if (res.ok) setRules(await res.json());
    } catch { /* ignore */ }
  }, []);

  const loadExecutions = useCallback(async () => {
    try {
      const res = await fetch("/api/executions");
      if (res.ok) setExecutions(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadRules();
    loadExecutions();
    const interval = setInterval(() => { loadRules(); loadExecutions(); }, 10_000);
    return () => clearInterval(interval);
  }, [loadRules, loadExecutions]);

  async function handleCompile() {
    if (!sentence.trim()) return;
    setCompiling(true);
    setResult(null);
    setDeployedAddress(null);
    setError(null);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: sentence.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCompiling(false);
    }
  }

  async function handleDeploy() {
    if (!result || result.kind !== "compiled") return;
    setDeploying(true);
    setError(null);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: result.template,
          deployArgs: result.deployArgs,
          sentence: result.sentence,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDeployedAddress(data.address);
      loadRules();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <header style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Mandate
        </h1>
        <p style={{ color: "#888", marginTop: 8, fontSize: 14 }}>
          Treasury rules in plain English. AI compiles once, then leaves.
        </p>
      </header>

      {/* Sentence input */}
      <section style={{ marginBottom: 32 }}>
        <label style={{ display: "block", fontSize: 13, color: "#888", marginBottom: 8 }}>
          Describe your treasury rule
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompile()}
            placeholder='e.g. "route 10% of every deposit to 0x99189B..."'
            disabled={compiling || deploying}
            style={{
              flex: 1, padding: "10px 14px", fontSize: 15,
              background: "#141414", border: "1px solid #333", borderRadius: 8,
              color: "#e5e5e5", outline: "none",
            }}
          />
          <button
            onClick={handleCompile}
            disabled={compiling || deploying || !sentence.trim()}
            style={{
              padding: "10px 20px", fontSize: 14, fontWeight: 600,
              background: compiling ? "#333" : "#2563eb", color: "#fff",
              border: "none", borderRadius: 8, cursor: compiling ? "wait" : "pointer",
            }}
          >
            {compiling ? "Compiling..." : "Compile"}
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", marginBottom: 24, background: "#1a0000",
          border: "1px solid #4a0000", borderRadius: 8, fontSize: 14, color: "#f87171",
        }}>
          {error}
        </div>
      )}

      {/* Compile result: refusal */}
      {result?.kind === "refusal" && (
        <div style={{
          padding: "16px 20px", marginBottom: 24, background: "#1a1400",
          border: "1px solid #4a3800", borderRadius: 8,
        }}>
          <div style={{ fontSize: 13, color: "#facc15", marginBottom: 6, fontWeight: 600 }}>
            Refused
          </div>
          <div style={{ fontSize: 15 }}>{result.reason}</div>
        </div>
      )}

      {/* Compile result: preview card */}
      {result?.kind === "compiled" && !deployedAddress && (
        <div style={{
          padding: "20px 24px", marginBottom: 24, background: "#0a1628",
          border: "1px solid #1e3a5f", borderRadius: 8,
        }}>
          <div style={{ fontSize: 13, color: "#60a5fa", marginBottom: 4, fontWeight: 600 }}>
            Preview: {result.template}
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 16 }}>
            {result.readback}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
            {Object.entries(result.params).map(([k, v]) => (
              <span key={k} style={{ marginRight: 16 }}>
                <span style={{ color: "#888" }}>{k}:</span>{" "}
                <span style={{ color: "#a3a3a3", fontFamily: "monospace" }}>
                  {String(v).length > 20 ? String(v).slice(0, 10) + "..." + String(v).slice(-8) : String(v)}
                </span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={handleDeploy}
              disabled={deploying}
              style={{
                padding: "10px 24px", fontSize: 14, fontWeight: 600,
                background: deploying ? "#333" : "#16a34a", color: "#fff",
                border: "none", borderRadius: 8, cursor: deploying ? "wait" : "pointer",
              }}
            >
              {deploying ? "Deploying..." : "Confirm and Deploy"}
            </button>
            <button
              onClick={() => { setResult(null); setError(null); }}
              disabled={deploying}
              style={{
                padding: "10px 16px", fontSize: 14, background: "transparent",
                color: "#888", border: "1px solid #333", borderRadius: 8, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <span style={{ fontSize: 12, color: "#555" }}>
              This is the AI's last contact. After deploy, execution is deterministic.
            </span>
          </div>
        </div>
      )}

      {/* Deployed confirmation */}
      {deployedAddress && (
        <div style={{
          padding: "16px 20px", marginBottom: 24, background: "#001a00",
          border: "1px solid #004a00", borderRadius: 8,
        }}>
          <div style={{ fontSize: 13, color: "#4ade80", marginBottom: 6, fontWeight: 600 }}>
            Deployed
          </div>
          <a
            href={`https://testnet.arcscan.app/address/${deployedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#60a5fa", fontSize: 14, fontFamily: "monospace" }}
          >
            {deployedAddress}
          </a>
          <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
            The AI is now permanently removed from this rule's execution path.
          </div>
        </div>
      )}

      {/* Deployed rules */}
      {rules.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Active Rules</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rules.map((rule) => (
              <div
                key={rule.address}
                style={{
                  padding: "14px 18px", background: "#141414",
                  border: "1px solid #262626", borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#d4d4d4" }}>
                    {rule.template}
                  </span>
                  <a
                    href={`https://testnet.arcscan.app/address/${rule.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#60a5fa", fontFamily: "monospace" }}
                  >
                    {rule.address.slice(0, 10)}...{rule.address.slice(-8)}
                  </a>
                </div>
                {rule.sourceSentence && (
                  <div style={{ fontSize: 13, color: "#777", marginTop: 4, fontStyle: "italic" }}>
                    "{rule.sourceSentence}"
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  {Object.entries(rule.params)
                    .filter(([k]) => k !== "owner")
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" | ")}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent executions */}
      {executions.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent Executions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {executions.slice(0, 20).map((exec, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 14px", background: "#141414",
                  border: "1px solid #1a1a1a", borderRadius: 6, fontSize: 13,
                }}
              >
                <span style={{ color: "#888" }}>
                  {new Date(exec.timestamp).toLocaleTimeString()}
                </span>
                {" "}
                <span style={{ color: "#a3a3a3" }}>{exec.template}</span>
                {" "}
                <span style={{ color: "#d4d4d4" }}>{exec.outcome}</span>
                {exec.txHash && (
                  <>
                    {" "}
                    <a
                      href={`https://testnet.arcscan.app/tx/${exec.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#60a5fa", fontSize: 12 }}
                    >
                      tx
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid #1a1a1a", fontSize: 12, color: "#444" }}>
        Built on Arc with USDC and CCTP V2.
        {" "}AI touches money zero times after compile.
      </footer>
    </div>
  );
}
