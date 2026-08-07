"use client";

import { useState } from "react";
import Link from "next/link";
import { C } from "./ui-theme";
import { GlobalStyle, Dot, Badge, SectionLabel, NavPill } from "./shared-ui";

const STEPS = [
  {
    n: "1",
    title: "Describe",
    body: "Write your treasury rule in plain English. The AI interprets your intent once.",
  },
  {
    n: "2",
    title: "Confirm",
    body: "Review the AI's readback. Confirm the parameters are correct. This is the AI's last contact.",
  },
  {
    n: "3",
    title: "Deploy",
    body: "The rule is compiled into a fixed, verified onchain template. Execution is deterministic forever.",
  },
];

const TEMPLATES = [
  {
    name: "SplitRule",
    body: "Routes a fixed share of every incoming USDC payment to a savings address. The rest stays.",
  },
  {
    name: "SweepRule",
    body: "Moves any surplus above a retained floor to a destination address on the same chain.",
  },
  {
    name: "BridgeRule",
    body: "Bridges surplus above a floor to a recipient on Base via CCTP on a schedule.",
  },
];

// Answers describe what the system actually does. Nothing here claims an audit,
// and nothing claims the AI is involved after compile, because it is not.
const FAQ = [
  {
    q: "What happens if the AI makes a mistake?",
    a: "It is built to refuse rather than guess. A sentence missing an address, a share, or a schedule is declined with the reason stated. When it does compile, every field is re-validated in code before anything can reach a deploy call, and you read a plain-English readback and confirm it yourself. Nothing reaches the chain without that click.",
  },
  {
    q: "Can anyone call execute() on my rule?",
    a: "Yes, and that is the point. execute() is permissionless, so the rule stays enforceable even if our keeper disappears. A caller cannot change where funds go or how much moves: those parameters are immutable in the deployed contract. All they can do is trigger the behaviour you already approved.",
  },
  {
    q: "What tokens does Mandate support?",
    a: "USDC only. Arc is USDC-native, so it is both the treasury asset and the gas token. All contract arithmetic goes through the 6-decimal USDC interface.",
  },
  {
    q: "Is the AI involved after deployment?",
    a: "No. There is exactly one model call per rule, at setup, before the contract exists. After that the deployed template is plain Solidity and the keeper is a log filter and a timer. You can verify this by grepping the repository: one file imports the model SDK, and nothing in the execution path touches it.",
  },
  {
    q: "What chain does this run on?",
    a: "Arc Testnet, chain 5042002, with every template source-verified on Arcscan. BridgeRule moves funds to Base Sepolia over CCTP V2, with the contract calling the burn itself rather than routing through a backend.",
  },
];

export default function MarketingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <GlobalStyle />
      <NavPill ctaLabel="Launch App" ctaHref="/app" />

      <main className="wrap">
        {/* Hero */}
        <section style={{ position: "relative", paddingTop: 180, paddingBottom: 120 }}>
          <h1
            className="hero-title"
            style={{
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.03,
              margin: 0,
              maxWidth: 940,
              color: C.headingDark,
            }}
          >
            Treasury Rules in Plain English
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: C.bodyLight,
              maxWidth: 500,
              marginTop: 32,
              marginBottom: 0,
            }}
          >
            AI compiles your intent once into a fixed onchain template, then leaves
            permanently. No model in the loop. No custody. No trust.
          </p>

          <Badge className="float-badge" style={{ position: "absolute", top: 130, right: 0 }}>
            Zero AI after compile
          </Badge>
          <Badge className="float-badge" style={{ position: "absolute", left: 0, bottom: 44 }}>
            3 fixed templates
          </Badge>
          <Badge className="float-badge" style={{ position: "absolute", right: 40, bottom: 60 }}>
            Deterministic execution
          </Badge>
        </section>

        {/* How it works */}
        <section style={{ paddingBottom: 120 }}>
          <SectionLabel>How it works</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
            {STEPS.map((step) => (
              <div key={step.n} style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    color: C.mint,
                    lineHeight: 1,
                    minWidth: 60,
                  }}
                >
                  {step.n}
                </span>
                <div>
                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: C.headingDark,
                      margin: "0 0 10px",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: C.bodyLight,
                      margin: 0,
                      maxWidth: 620,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section style={{ paddingBottom: 120 }}>
          <SectionLabel>Templates</SectionLabel>
          {TEMPLATES.map((t) => (
            <Link
              key={t.name}
              href="/app"
              className="row-link"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 24,
                borderBottom: `1px solid ${C.border}`,
                padding: "24px 0",
                textDecoration: "none",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: C.headingDark,
                    margin: "0 0 8px",
                  }}
                >
                  {t.name}
                  <Dot color={C.lavender} size={10} />
                </h3>
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: C.bodyLight,
                    margin: 0,
                    maxWidth: 720,
                  }}
                >
                  {t.body}
                </p>
              </div>
              <span style={{ fontSize: 18, color: C.headingDark }}>{"-->"}</span>
            </Link>
          ))}
        </section>
      </main>

      {/* Stats marquee, full bleed */}
      <section style={{ overflow: "hidden", position: "relative", padding: "40px 0 60px" }}>
        <div className="marquee-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} style={{ display: "flex", alignItems: "center" }}>
              {[0, 1].map((i) => (
                <span key={i} style={{ display: "flex", alignItems: "center" }}>
                  <span
                    className="marquee-text"
                    style={{
                      fontSize: 150,
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      color: C.headingDark,
                      whiteSpace: "nowrap",
                      lineHeight: 1.1,
                    }}
                  >
                    Zero AI after compile
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: C.headingDark,
                      margin: "0 48px",
                      flexShrink: 0,
                    }}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
        {/* Readable equivalent of the decorative marquee above. */}
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Zero AI after compile
        </span>
        <div
          className="wrap"
          style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 24 }}
        >
          <Badge>Permissionless execute()</Badge>
          <Badge>Verified on Arcscan</Badge>
        </div>
      </section>

      <main className="wrap">
        {/* The difference */}
        <section
          className="dark-card"
          style={{ background: C.dark, borderRadius: 24, padding: 48, marginBottom: 120 }}
        >
          <h2
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: C.headingLight,
              letterSpacing: "-0.02em",
              margin: "0 0 40px",
              maxWidth: 700,
            }}
          >
            The AI compiles. It never executes.
          </h2>
          <div
            className="two-col"
            style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48 }}
          >
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: C.bodyDark,
                margin: 0,
                borderLeft: `4px solid ${C.mint}`,
                paddingLeft: 24,
              }}
            >
              Other tools keep an AI in the loop for every transaction. Mandate removes it
              permanently after setup. The deployed contract is a fixed, verified template
              with immutable parameters. Anyone can call execute(). No API key, no model,
              no oracle.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {[
                { label: "AI calls per rule", value: "1" },
                { label: "AI calls per execution", value: "0" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: 56, fontWeight: 700, color: C.mint, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 14, color: C.bodyDark, marginTop: 8 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: "center", paddingBottom: 120 }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: C.headingDark,
              letterSpacing: "-0.02em",
              margin: "0 0 32px",
            }}
          >
            Ready to set your first rule?
          </h2>
          <Link
            className="btn"
            href="/app"
            style={{
              display: "inline-block",
              background: C.mint,
              color: C.headingDark,
              borderRadius: 50,
              padding: "16px 40px",
              fontSize: 18,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Launch App
          </Link>
        </section>

        {/* FAQ */}
        <section style={{ paddingBottom: 120 }}>
          <SectionLabel>FAQ</SectionLabel>
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} style={{ borderBottom: `1px solid ${C.border}` }}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 24,
                    background: "transparent",
                    border: "none",
                    padding: "24px 0",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 500, color: C.headingDark }}>
                    {item.q}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: C.mint,
                      color: C.headingDark,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      transition: "transform 0.3s ease",
                      transform: open ? "rotate(180deg)" : "none",
                    }}
                  >
                    v
                  </span>
                </button>
                <div
                  className="faq-answer"
                  // Generous ceiling: the transition needs a fixed value, and a
                  // tight one silently clips the longest answer on narrow screens.
                  style={{ maxHeight: open ? 600 : 0, opacity: open ? 1 : 0 }}
                >
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.7,
                      color: C.bodyLight,
                      margin: 0,
                      paddingBottom: 24,
                      maxWidth: 820,
                    }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: C.dark, paddingTop: 80, paddingBottom: 48 }}>
        <div className="wrap" style={{ textAlign: "center" }}>
          <div
            className="footer-title"
            style={{
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: C.headingLight,
              lineHeight: 1.1,
            }}
          >
            Mandate
          </div>
          <div style={{ fontSize: 14, color: "#555555", marginTop: 16 }}>
            Built on Arc with USDC and CCTP V2.
          </div>
          <div style={{ fontSize: 14, color: "#555555", marginTop: 8 }}>
            AI touches money zero times after compile.
          </div>
        </div>
      </footer>
    </>
  );
}
