// Design tokens and the small amount of CSS that inline styles cannot express.
// Shared by the marketing page and the app so the palette is defined once.

export const C = {
  bg: "#f5f5f0",
  dark: "#0a0a0a",
  mint: "#6ee7b7",
  lavender: "#c4b5fd",
  white: "#ffffff",
  headingDark: "#0a0a0a",
  headingLight: "#ffffff",
  bodyLight: "#555555",
  bodyDark: "#aaaaaa",
  muted: "#888888",
  faint: "#999999",
  border: "#e5e5e5",
  borderDark: "#262626",
  rowDark: "#1a1a1a",
  error: "#f87171",
  errorBg: "#1a0000",
  warn: "#facc15",
  disabled: "#e5e5e5",
  disabledText: "#999999",
  loading: "#d1d5db",
};

export const MONO = '"JetBrains Mono", "Fira Code", monospace';

export const ARCSCAN = "https://testnet.arcscan.app";

/// Shorten a long value (an address, a bytes32) for display.
export function truncate(value: string) {
  return value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

// Placeholder colour, focus, hover, media queries and keyframes have no inline
// equivalent, so they live here and are injected as a <style> tag. Deliberately
// no entrance animations on content: an element that starts at opacity 0 can be
// captured mid-animation by a screenshot or a recording and look like a bug.
export const GLOBAL_CSS = `
  .wrap { max-width: 1200px; margin: 0 auto; padding: 0 80px; }
  .wrap-narrow { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
  .mandate-input::placeholder { color: #aaaaaa; }
  .mandate-input:focus { border-color: ${C.mint}; outline: none; }
  .btn { transition: all 0.2s ease; }
  .btn:hover:not(:disabled) { filter: brightness(1.05); }
  .btn:disabled { cursor: not-allowed; }
  .link { transition: all 0.2s ease; }
  .link:hover { text-decoration: underline; }
  .row-link { transition: all 0.2s ease; }
  .row-link:hover { padding-left: 8px; }
  .faq-answer { overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .marquee-track { display: flex; width: max-content; animation: marquee 30s linear infinite; }
  @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
  @media (max-width: 860px) {
    .wrap { padding: 0 20px; }
    .hero-title { font-size: 44px !important; }
    .footer-title { font-size: 44px !important; }
    .marquee-text { font-size: 64px !important; }
    .float-badge { display: none !important; }
    .input-row { flex-direction: column !important; }
    .dark-card { padding: 28px !important; }
    .two-col { grid-template-columns: 1fr !important; }
    .rule-row, .exec-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
  }
`;
