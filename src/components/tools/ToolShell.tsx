"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PCard } from "@/components/poster";

type ToolShellProps = {
  title: string;
  description: string;
  form: React.ReactNode;
  result: React.ReactNode;
  formWidth?: number;
};

export function ToolShell({ title, description, form, result, formWidth = 380 }: ToolShellProps) {
  return (
    <div
      className="poster-scope"
      style={{
        minHeight: "100%",
        background: "var(--poster-bg)",
        padding: "20px 20px 32px",
        fontFamily: "var(--font-display)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Header */}
        <PCard rounded={14} style={{ padding: "14px 18px", background: "var(--poster-panel)" }}>
          <Link
            href="/tools"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--poster-ink-2)",
              textDecoration: "none",
              marginBottom: 6,
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Araçlara Dön
          </Link>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--poster-ink)",
              letterSpacing: "-.02em",
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 13, color: "var(--poster-ink-2)", margin: "3px 0 0" }}>{description}</p>
        </PCard>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `minmax(0, ${formWidth}px) minmax(0, 1fr)`,
            gap: 20,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <PCard rounded={18} style={{ padding: 18, background: "var(--poster-panel)" }}>
              {form}
            </PCard>
          </div>
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>{result}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard empty-state card shown in the result panel before anything is generated.
 */
export function ToolEmptyState({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div
      style={{
        minHeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--poster-bg-2)",
        border: "2px dashed var(--poster-ink-3)",
        borderRadius: 18,
      }}
    >
      <div style={{ textAlign: "center", padding: "0 32px" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--poster-ink-2)", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: "var(--poster-ink-3)", margin: "4px 0 0" }}>{hint}</p>
      </div>
    </div>
  );
}

/**
 * Spinner loading card with rotating message slot.
 */
export function ToolLoadingCard({ children }: { children?: React.ReactNode }) {
  return (
    <PCard
      rounded={18}
      style={{
        minHeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--poster-panel)",
      }}
    >
      <div style={{ textAlign: "center", padding: "0 32px" }}>
        <div
          style={{
            width: 40,
            height: 40,
            margin: "0 auto 16px",
            borderRadius: "50%",
            border: "4px solid rgba(254,112,58,.2)",
            borderTopColor: "var(--poster-accent)",
            animation: "spin 1s linear infinite",
          }}
        />
        {children}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </PCard>
  );
}
