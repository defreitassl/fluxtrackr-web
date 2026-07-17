"use client";

import {
  Bell,
  ChartNoAxesCombined,
  FolderTree,
  Landmark,
  ListTree,
  PanelTop,
  ReceiptText,
  Settings2,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavItem } from "@/components/navigation/nav-item";

const groups = [
  {
    label: "Visão geral",
    items: [{ href: "/dashboard", label: "Dashboard", icon: PanelTop }],
  },
  {
    label: "Planejamento",
    items: [
      { href: "/timeline", label: "Timeline", icon: ListTree },
      { href: "/planning", label: "Planejamento", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "Organização",
    items: [
      { href: "/wallet", label: "Carteira", icon: Landmark },
      { href: "/transactions", label: "Movimentações", icon: ReceiptText },
      { href: "/categories", label: "Categorias", icon: FolderTree },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/settings", label: "Configurações", icon: Settings2 },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Navegação principal">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <ChartNoAxesCombined size={19} strokeWidth={2.4} />
        </span>
        <span>FluxTrackr</span>
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
    </aside>
  );
}
