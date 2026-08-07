"use client";

import { useState, useEffect, useCallback } from "react";
import { C, MONO, ARCSCAN, truncate } from "../ui-theme";
import { GlobalStyle, Dot, NavPill } from "../shared-ui";

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
  trigger?: string;
};

export default function AppPage() {
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

  const compileDisabled = compiling || deploying || !sentence.trim();

  return (
    <>
      <GlobalStyle />
      <NavPill ctaLabel="Home" ctaHref="/" />

      <main className="wrap-narrow" style={{ paddingTop: 120 }}>
        {/* Sentence input */}
        <section style={{ marginBottom: 32 }}>
          <label style={{ display: "block", fontSize: 13, color: C.muted, marginBottom: 10 }}>
            Describe your treasury rule
          </label>
          <div className="input-row" style={{ display: "flex", gap: 12 }}>
            <input
              className="mandate-input"
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCompile()}
              placeholder='e.g. "route 10% of every incoming payment to 0x99189B..."'
              disabled={compiling || deploying}
              style={{
                flex: 1,
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "14px 18px",
                fontSize: 16,
                color: C.headingDark,
                fontFamily: "inherit",
                transition: "border-color 0.2s ease",
              }}
            />
            <button
              className="btn"
              onClick={handleCompile}
              disabled={compileDisabled}
              style={{
                background: compiling ? C.loading : compileDisabled ? C.disabled : C.mint,
                color: compileDisabled ? C.disabledText : C.headingDark,
                border: "none",
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 600,
                cursor: compiling ? "wait" : "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {compiling ? "Compiling..." : "Compile"}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "14px 18px",
              marginBottom: 24,
              background: C.errorBg,
              border: "1px solid #4a0000",
              borderRadius: 12,
              fontSize: 14,
              color: C.error,
            }}
          >
            {error}
          </div>
        )}

        {/* Refusal. The refusal is the product working, not an error. */}
        {result?.kind === "refusal" && (
          <div
            style={{
              borderLeft: `4px solid ${C.warn}`,
              padding: "4px 0 4px 24px",
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: C.warn, marginBottom: 8 }}>
              Refused
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.6, color: C.headingDark }}>
              {result.reason}
            </div>
          </div>
        )}

        {/* Preview: the AI's last contact before a human confirms */}
        {result?.kind === "compiled" && !deployedAddress && (
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              borderLeft: `4px solid ${C.mint}`,
              padding: 28,
              marginBottom: 32,
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.mint,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}
            >
              Preview: {result.template}
            </div>
            <div style={{ fontSize: 18, lineHeight: 1.6, color: C.headingDark, marginBottom: 20 }}>
              {result.readback}
            </div>
            <div style={{ marginBottom: 24 }}>
              {Object.entries(result.params).map(([k, v]) => (
                <span key={k} style={{ marginRight: 20, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{k}: </span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: C.headingDark }}>
                    {truncate(String(v))}
                  </span>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="btn"
                onClick={handleDeploy}
                disabled={deploying}
                style={{
                  background: deploying ? C.loading : C.mint,
                  color: deploying ? C.disabledText : C.headingDark,
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 28px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: deploying ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {deploying ? "Deploying..." : "Confirm and Deploy"}
              </button>
              <button
                className="btn"
                onClick={() => { setResult(null); setError(null); }}
                disabled={deploying}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  color: C.muted,
                  borderRadius: 12,
                  padding: "12px 22px",
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <span style={{ fontSize: 12, color: C.faint }}>
                This is the AI&apos;s last contact. After deploy, execution is deterministic.
              </span>
            </div>
          </div>
        )}

        {/* Deployed confirmation */}
        {deployedAddress && (
          <div
            style={{
              borderLeft: `4px solid ${C.mint}`,
              padding: "4px 0 4px 24px",
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: C.mint, marginBottom: 8 }}>
              Deployed
            </div>
            <a
              className="link"
              href={`${ARCSCAN}/address/${deployedAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: MONO, fontSize: 14, color: C.mint, textDecoration: "none" }}
            >
              {deployedAddress}
            </a>
            <div style={{ fontSize: 12, color: C.faint, marginTop: 8 }}>
              The AI is now permanently removed from this rule&apos;s execution path.
            </div>
          </div>
        )}

        {/* Active rules */}
        {rules.length > 0 && (
          <section
            className="dark-card"
            style={{ background: C.dark, borderRadius: 24, padding: 32, marginTop: 56 }}
          >
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: C.headingLight,
                margin: "0 0 16px",
                letterSpacing: "-0.01em",
              }}
            >
              <Dot />
              Active Rules
            </h2>
            {rules.map((rule) => (
              <div
                key={rule.address}
                style={{ borderBottom: `1px solid ${C.rowDark}`, padding: "16px 0" }}
              >
                <div
                  className="rule-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#e5e5e5" }}>
                    {rule.template}
                  </span>
                  <a
                    className="link"
                    href={`${ARCSCAN}/address/${rule.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: MONO, fontSize: 12, color: C.mint, textDecoration: "none" }}
                  >
                    {truncate(rule.address)}
                  </a>
                </div>
                {rule.sourceSentence && (
                  <div style={{ fontSize: 13, color: "#666666", fontStyle: "italic", marginTop: 6 }}>
                    &ldquo;{rule.sourceSentence}&rdquo;
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#555555", marginTop: 6 }}>
                  {Object.entries(rule.params)
                    .filter(([k]) => k !== "owner")
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" | ")}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Recent executions */}
        {executions.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: C.headingDark,
                margin: "0 0 16px",
                letterSpacing: "-0.01em",
              }}
            >
              <Dot />
              Recent Executions
            </h2>
            {executions.slice(0, 20).map((exec, i) => (
              <div
                key={`${exec.txHash ?? "no-tx"}-${i}`}
                className="exec-row"
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  borderBottom: `1px solid ${C.border}`,
                  padding: "12px 0",
                }}
              >
                <span style={{ fontSize: 13, color: C.muted, minWidth: 76 }}>
                  {new Date(exec.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ fontSize: 13, color: C.bodyLight, minWidth: 92 }}>
                  {exec.template}
                </span>
                <span style={{ fontSize: 13, color: C.headingDark, flex: 1 }}>
                  {exec.outcome}
                </span>
                {exec.trigger && (
                  <span
                    style={{
                      fontSize: 12,
                      color: C.headingDark,
                      background: C.lavender,
                      borderRadius: 20,
                      padding: "3px 12px",
                    }}
                  >
                    {exec.trigger}
                  </span>
                )}
                {exec.txHash && (
                  <a
                    className="link"
                    href={`${ARCSCAN}/tx/${exec.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: C.mint, textDecoration: "none" }}
                  >
                    tx
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        <footer
          style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 24,
            marginTop: 64,
            paddingBottom: 40,
            fontSize: 12,
            color: C.faint,
          }}
        >
          Built on Arc
        </footer>
      </main>
    </>
  );
}
