"use client";

import { Calendar, House, Menu, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { getContextualCta } from "@/components/layout/contextual-cta";
import { MoreMenuSheet, type NavigationBadges } from "@/components/layout/more-menu-sheet";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { useUnreadNotificationsCount } from "@/features/notifications/queries/use-unread-notifications-count";
import { cn } from "@/lib/cn";

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type BottomNavRouteProps = {
  pathname: string;
};

function BottomNavRoute({ pathname }: BottomNavRouteProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: overview } = useDashboardOverview();
  const { data: unread } = useUnreadNotificationsCount();
  const cta = getContextualCta(pathname);

  const badges = useMemo<NavigationBadges>(
    () => ({
      timeline: overview?.upcomingCommitments.length,
      events: overview?.upcomingCommitments.filter((commitment) => commitment.sourceType === "financial_event").length,
      planning: overview
        ? overview.budgetSummary.nearLimitCount + overview.budgetSummary.exceededCount
        : undefined,
      notifications: unread?.unreadCount,
    }),
    [overview, unread],
  );

  const closeMore = useCallback(() => setMoreOpen(false), []);

  function runContextualAction() {
    if (cta) {
      window.dispatchEvent(new Event(cta.event));
      return;
    }

    router.push("/transactions");
  }

  return (
    <>
      <nav aria-label="Navegação móvel" className="bnx-nav">
        <Link
          aria-current={isCurrentRoute(pathname, "/dashboard") ? "page" : undefined}
          className={cn("bnx-slot", isCurrentRoute(pathname, "/dashboard") && "bnx-slot-active")}
          href="/dashboard"
        >
          <House aria-hidden="true" size={19} strokeWidth={1.9} />
          <span>Início</span>
        </Link>
        <Link
          aria-label={badges.timeline && badges.timeline > 0 ? `Timeline, ${badges.timeline} pendências` : "Timeline"}
          aria-current={isCurrentRoute(pathname, "/timeline") ? "page" : undefined}
          className={cn("bnx-slot", isCurrentRoute(pathname, "/timeline") && "bnx-slot-active")}
          href="/timeline"
        >
          <span className="bnx-slot-icon">
            <Calendar aria-hidden="true" size={19} strokeWidth={1.9} />
            {badges.timeline !== undefined && badges.timeline > 0 ? <b>{badges.timeline}</b> : null}
          </span>
          <span>Timeline</span>
        </Link>
        <button aria-label={cta?.label ?? "Nova movimentação"} className="bnx-fab" onClick={runContextualAction} type="button">
          <Plus aria-hidden="true" size={24} strokeWidth={2.7} />
        </button>
        <Link
          aria-current={isCurrentRoute(pathname, "/wallet") ? "page" : undefined}
          className={cn("bnx-slot", isCurrentRoute(pathname, "/wallet") && "bnx-slot-active")}
          href="/wallet"
        >
          <Wallet aria-hidden="true" size={19} strokeWidth={1.9} />
          <span>Carteira</span>
        </Link>
        <button
          aria-controls="bnx-more-menu"
          aria-expanded={moreOpen}
          className={cn("bnx-slot", moreOpen && "bnx-slot-active")}
          onClick={() => setMoreOpen((value) => !value)}
          ref={triggerRef}
          type="button"
        >
          <Menu aria-hidden="true" size={20} strokeWidth={1.9} />
          <span>Mais</span>
        </button>
      </nav>
      <MoreMenuSheet badges={badges} onClose={closeMore} open={moreOpen} pathname={pathname} triggerRef={triggerRef} />
    </>
  );
}

/** A chave por rota reinicia o sheet durante a navegação, sem estado residual. */
export function BottomNav() {
  const pathname = usePathname();

  return <BottomNavRoute key={pathname} pathname={pathname} />;
}
