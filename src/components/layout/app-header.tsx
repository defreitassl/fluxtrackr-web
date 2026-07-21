"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, ChevronDown, PanelLeft, Plus, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { NotificationButton } from "@/components/layout/notification-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useGlobalSearch } from "@/providers/search-provider";

const searchPlaceholders: Record<string, string> = {
  "/transactions": "Buscar por descrição, valor ou categoria",
  "/timeline": "Buscar evento por descrição ou categoria",
  "/wallet": "Buscar conta ou cartão",
};

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Visão financeira", subtitle: "Início · dinheiro disponível e projeção" },
  "/timeline": { title: "Timeline", subtitle: "Seus eventos financeiros em ordem cronológica" },
  "/transactions": { title: "Transações", subtitle: "Registre, filtre e edite suas movimentações" },
  "/wallet": { title: "Carteira", subtitle: "Contas, cartões e faturas" },
  "/planning": { title: "Planejamento", subtitle: "Orçamentos por categoria" },
  "/categories": { title: "Categorias", subtitle: "Organização dos lançamentos" },
  "/notifications": { title: "Notificações", subtitle: "Alertas e avisos da conta" },
  "/settings": { title: "Configurações", subtitle: "Preferências da conta" },
};

function getPageTitle(pathname: string) {
  const match = Object.keys(pageTitles).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  return match ? pageTitles[match] : { title: "FluxTrackr", subtitle: "Gestão pessoal" };
}

function getCurrentPeriodLabel() {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1).replace(" de ", " ");
}

type AppHeaderProps = {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
};

export function AppHeader({ onToggleSidebar, sidebarCollapsed }: AppHeaderProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const { query, setQuery } = useGlobalSearch();
  const { title, subtitle } = getPageTitle(pathname);
  const searchPlaceholder =
    Object.entries(searchPlaceholders).find(([route]) => pathname.startsWith(route))?.[1] ??
    "Buscar transações, contas ou categorias";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="app-header">
      <div className="header-lead">
        <button
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          className="icon-button"
          onClick={onToggleSidebar}
          type="button"
        >
          <PanelLeft aria-hidden="true" size={18} />
        </button>
        <div className="header-title">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
      </div>

      <label className="header-search">
        <Search aria-hidden="true" size={15} />
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          ref={searchRef}
          type="search"
          value={query}
        />
        <span className="header-kbd" aria-hidden="true">
          Ctrl /
        </span>
      </label>

      <div className="header-actions">
        <div className="header-period">
          {getCurrentPeriodLabel()}
          <ChevronDown aria-hidden="true" color="var(--text-muted)" size={15} />
        </div>
        <button
          aria-label="Atualizar dados"
          className="icon-button"
          onClick={() => queryClient.invalidateQueries()}
          title="Atualizar"
          type="button"
        >
          <RefreshCw aria-hidden="true" size={17} />
        </button>
        <ThemeToggle />
        <NotificationButton />
        {pathname.startsWith("/wallet") ? (
          <>
            <button
              className="header-period"
              onClick={() => window.dispatchEvent(new Event("fluxtrackr:wallet-transfer"))}
              style={{ cursor: "pointer" }}
              type="button"
            >
              <ArrowLeftRight aria-hidden="true" color="var(--text-muted)" size={15} />
              Transferir
            </button>
            <button
              className="primary-cta"
              onClick={() => window.dispatchEvent(new Event("fluxtrackr:wallet-add"))}
              type="button"
            >
              <Plus aria-hidden="true" size={15} strokeWidth={2.4} />
              Adicionar
            </button>
          </>
        ) : pathname.startsWith("/transactions") ? (
          <button
            className="primary-cta"
            onClick={() => window.dispatchEvent(new Event("fluxtrackr:new-transaction"))}
            type="button"
          >
            <Plus aria-hidden="true" size={15} strokeWidth={2.4} />
            Nova movimentação
          </button>
        ) : (
          <Link className="primary-cta" href="/transactions">
            <Plus aria-hidden="true" size={15} strokeWidth={2.4} />
            Nova movimentação
          </Link>
        )}
      </div>
    </header>
  );
}
