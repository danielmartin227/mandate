// Small presentational pieces used by both the marketing page and the app.
import Link from "next/link";
import { C, GLOBAL_CSS } from "./ui-theme";

/// Injects the rules inline styles cannot express. Render once per page.
export function GlobalStyle() {
  return <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />;
}

/// The mint bullet used before section headings.
export function Dot({ color = C.mint, size = 8 }: { color?: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        marginRight: 12,
        verticalAlign: "middle",
      }}
    />
  );
}

/// Mint pill used for the floating hero and marquee callouts.
export function Badge({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        background: C.mint,
        color: C.headingDark,
        borderRadius: 20,
        padding: "8px 20px",
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/// Outline pill used as a section label, e.g. "How it works".
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: "4px 16px",
        fontSize: 13,
        fontWeight: 500,
        color: C.bodyLight,
        marginBottom: 40,
      }}
    >
      {"-> "}
      {children}
    </span>
  );
}

/// Floating navigation pill, fixed to the top of the viewport.
export function NavPill({ ctaLabel, ctaHref }: { ctaLabel: string; ctaHref: string }) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 24,
        background: C.white,
        borderRadius: 50,
        boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
        padding: "8px 8px 8px 24px",
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: C.headingDark,
          textDecoration: "none",
        }}
      >
        Mandate
      </Link>
      <Link
        className="btn"
        href={ctaHref}
        style={{
          background: C.mint,
          color: C.headingDark,
          borderRadius: 50,
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {ctaLabel}
      </Link>
    </nav>
  );
}
