import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mandate",
  description: "Treasury rules in plain English, compiled once into deterministic onchain flows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#0a0a0a", color: "#e5e5e5" }}>
        {children}
      </body>
    </html>
  );
}
