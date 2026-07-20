"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  titleId: string;
  descriptionId?: string;
  /** Quando verdadeiro, impede fechar por Escape, overlay ou botão (durante envio). */
  busy?: boolean;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Diálogo modal acessível e reutilizável, sem biblioteca externa de overlays.
 * Controla foco inicial, retorno de foco ao acionador, `aria-modal`, fechamento
 * por Escape/overlay e bloqueio de interação externa enquanto aberto.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  titleId,
  descriptionId,
  busy = false,
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const requestClose = useCallback(() => {
    if (!busy) {
      onClose();
    }
  }, [busy, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables?.[0] ?? panelRef.current)?.focus();

    return () => {
      body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusables || focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, requestClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="dialog-overlay" onMouseDown={requestClose}>
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="dialog-panel"
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button
            aria-label="Fechar"
            className="dialog-close"
            disabled={busy}
            onClick={requestClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
