import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mandate",
  description: "Treasury rules in plain English, compiled once into deterministic onchain flows.",
};

const FONT_STACK = '"Inter", "DM Sans", system-ui, -apple-system, sans-serif';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: FONT_STACK,
          background: "#f5f5f0",
          color: "#0a0a0a",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {children}
      </body>
    </html>
  );
}
