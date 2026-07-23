"use client";

import {
  Bell,
  CalendarClock,
  ChartNoAxesColumn,
  ReceiptText,
  Repeat,
  Settings,
  Tag,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, type RefObject } from "react";

import { cn } from "@/lib/cn";

export type NavigationBadges = {
  timeline?: number;
  events?: number;
  planning?: number;
  notifications?: number;
};

type MoreMenuSheetProps = {
  open: boolean;
  onClose: () => void;
  pathname: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  badges: NavigationBadges;
};

type MoreMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: keyof NavigationBadges;
};

const moreMenuItems: MoreMenuItem[] = [
  { href: "/events", label: "Eventos", icon: CalendarClock, badge: "events" },
  { href: "/transactions", label: "Transações", icon: ReceiptText },
  { href: "/recurrences", label: "Recorrências", icon: Repeat },
  { href: "/planning", label: "Planejamento", icon: ChartNoAxesColumn, badge: "planning" },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/categories", label: "Categorias", icon: Tag },
  { href: "/notifications", label: "Notificações", icon: Bell, badge: "notifications" },
  { href: "/settings", label: "Perfil", icon: Settings },
];

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableElements(panel: HTMLDivElement | null) {
  return Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
}

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MoreMenuSheet({ open, onClose, pathname, triggerRef, badges }: MoreMenuSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-more-menu-close]")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = focusableElements(panelRef.current);
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (!panelRef.current?.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="bnx-sheet-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="bnx-more-menu-title"
        aria-modal="true"
        className="bnx-sheet"
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="bnx-sheet-handle" aria-hidden="true" />
        <header className="bnx-sheet-header">
          <div>
            <span>Explorar</span>
            <h2 id="bnx-more-menu-title">Mais opções</h2>
          </div>
          <button aria-label="Fechar mais opções" data-more-menu-close onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <nav aria-label="Mais opções" className="bnx-sheet-nav">
          {moreMenuItems.map((item) => {
            const Icon = item.icon;
            const badge = item.badge ? badges[item.badge] : undefined;
            const active = isCurrentRoute(pathname, item.href);
            const accessibleLabel = badge && badge > 0
              ? `${item.label}, ${badge} ${badge === 1 ? "pendência" : "pendências"}`
              : item.label;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                aria-label={accessibleLabel}
                className={cn("bnx-sheet-link", active && "bnx-sheet-link-active")}
                href={item.href}
                key={item.href}
                onClick={onClose}
              >
                <span className="bnx-sheet-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span>{item.label}</span>
                {badge !== undefined && badge > 0 ? <b>{badge}</b> : null}
              </Link>
            );
          })}
        </nav>
      </section>
    </div>,
    document.body,
  );
}
