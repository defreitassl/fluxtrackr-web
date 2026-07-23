"use client";

import {
  Calendar,
  CalendarClock,
  ChartNoAxesColumn,
  ChartNoAxesCombined,
  ReceiptText,
  Repeat,
  Tag,
  Target,
  House,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarProfile } from "@/components/layout/sidebar-profile";
import { NavItem } from "@/components/navigation/nav-item";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";

type AppSidebarProps = {
  email: string;
};

export function AppSidebar({ email }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: overview } = useDashboardOverview();

  const timelineBadge = overview?.upcomingCommitments.length;
  const eventsBadge = overview?.upcomingCommitments.filter(
    (commitment) => commitment.sourceType === "financial_event",
  ).length;
  const planningBadge = overview
    ? overview.budgetSummary.nearLimitCount + overview.budgetSummary.exceededCount
    : undefined;

  const groups = [
    {
      label: "Visão geral",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: House },
        { href: "/timeline", label: "Timeline", icon: Calendar, badge: timelineBadge },
        { href: "/events", label: "Eventos", icon: CalendarClock, badge: eventsBadge },
      ],
    },
    {
      label: "Operações",
      items: [
        { href: "/transactions", label: "Transações", icon: ReceiptText },
        { href: "/wallet", label: "Carteira", icon: Wallet },
        { href: "/recurrences", label: "Recorrências", icon: Repeat },
      ],
    },
    {
      label: "Planejamento",
      items: [
        { href: "/planning", label: "Planejamento", icon: ChartNoAxesColumn, badge: planningBadge },
        { href: "/goals", label: "Metas", icon: Target },
      ],
    },
    {
      label: "Organização",
      items: [{ href: "/categories", label: "Categorias", icon: Tag }],
    },
  ];

  return (
    <aside className="app-sidebar" aria-label="Navegação principal">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          <ChartNoAxesCombined size={19} strokeWidth={2.4} />
        </span>
        <span className="brand-copy sidebar-label">
          <strong>FluxTrackr</strong>
          <span>Gestão pessoal</span>
        </span>
      </div>

      <nav className="sidebar-navigation">
        {groups.map((group) => (
          <section className="nav-group" key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            <div className="nav-group-items">
              {group.items.map((item) => (
                <NavItem
                  {...item}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  key={item.href}
                />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="sidebar-footer">
        <SidebarProfile email={email} />
      </div>
    </aside>
  );
}
