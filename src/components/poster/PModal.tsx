"use client";
import * as React from "react";
import { ModalPortal } from "./modal-portal";

type PModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  /** If true, backdrop click does not close. */
  persistent?: boolean;
};

/**
 * Poster modal — wraps ModalPortal, keeps its portal + scroll-lock contract.
 * - Ink 2px border + hard shadow panel
 * - Backdrop dims page, click-to-close unless persistent
 * - ESC closes; focus restored to opener trigger when modal closes
 */
export function PModal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
  persistent = false,
}: PModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const triggerRef = React.useRef<HTMLElement | null>(null);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !persistent) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, persistent]);

  // Body scroll lock + focus capture/restore
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    if (opener && opener !== document.body) {
      triggerRef.current = opener;
    }
    return () => {
      document.body.style.overflow = prev;
      const t = triggerRef.current;
      triggerRef.current = null;
      if (t && typeof t.focus === "function") {
        // schedule after portal unmount so the trigger isn't covered
        requestAnimationFrame(() => t.focus({ preventScroll: true }));
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "rgba(14,30,38,.55)",
          backdropFilter: "blur(4px)",
          overscrollBehavior: "contain",
        }}
        onClick={() => {
          if (!persistent) onClose();
        }}
      >
        <div
          ref={panelRef}
          className="poster-scope"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: typeof width === "number" ? `min(${width}px, 95vw)` : width,
            maxHeight: "calc(100vh - 32px)",
            background: "var(--poster-panel)",
            border: "2px solid var(--poster-ink)",
            borderRadius: 18,
            boxShadow: "var(--poster-shadow-lg)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "var(--font-display)",
            color: "var(--poster-ink)",
          }}
        >
          {title && (
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "2px solid var(--poster-ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background: "var(--poster-bg-2)",
              }}
            >
              <div id={titleId} style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.01em" }}>{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                style={{
                  width: 40,
                  height: 40,
                  border: "2px solid var(--poster-ink)",
                  borderRadius: 8,
                  background: "var(--poster-panel)",
                  boxShadow: "0 2px 0 var(--poster-ink)",
                  cursor: "pointer",
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--poster-ink)",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          )}

          <div style={{ padding: 20, overflow: "auto", flex: 1 }}>{children}</div>

          {footer && (
            <div
              style={{
                padding: "14px 20px",
                borderTop: "2px solid var(--poster-ink)",
                background: "var(--poster-bg)",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
