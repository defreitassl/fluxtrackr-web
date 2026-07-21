"use client";

import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";

import { formatPlanningPeriod, type PlanningPeriod } from "@/features/planning/lib/planning-period";

type PlanningHeaderProps = {
  canCreateBudget: boolean;
  isCurrentPeriod: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  onCreateBudget: () => void;
  onMovePeriod: (months: number) => void;
  onSelectCurrentPeriod: () => void;
  onRefresh: () => void;
  period: PlanningPeriod;
};

export function PlanningHeader({
  canCreateBudget,
  isCurrentPeriod,
  isInitialLoading,
  isRefreshing,
  onCreateBudget,
  onMovePeriod,
  onSelectCurrentPeriod,
  onRefresh,
  period,
}: PlanningHeaderProps) {
  return (
    <header className="planning-page-header">
      <div>
        <p className="page-eyebrow">Organização</p>
        <h1 id="planning-title">Planejamento</h1>
        <p>Orçamentos mensais por categoria, consolidados a partir dos dados da API.</p>
      </div>

      <div className="planning-header-actions">
        <button
          aria-label="Atualizar Planejamento"
          className="secondary-button planning-refresh-button"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={isRefreshing ? "is-spinning" : undefined} size={16} />
          {isRefreshing && !isInitialLoading ? "Atualizando…" : "Atualizar"}
        </button>
        <button
          className="primary-button"
          disabled={!canCreateBudget}
          onClick={onCreateBudget}
          type="button"
        >
          <Plus aria-hidden="true" size={17} />
          Novo orçamento
        </button>
      </div>

      <div className="planning-period-control" aria-label="Selecionar período de planejamento">
        <button aria-label="Mês anterior" className="icon-button" onClick={() => onMovePeriod(-1)} type="button">
          <ChevronLeft aria-hidden="true" size={18} />
        </button>
        <p aria-live="polite">{formatPlanningPeriod(period)}</p>
        <button aria-label="Próximo mês" className="icon-button" onClick={() => onMovePeriod(1)} type="button">
          <ChevronRight aria-hidden="true" size={18} />
        </button>
        <button
          className="secondary-button planning-current-period-button"
          disabled={isCurrentPeriod}
          onClick={onSelectCurrentPeriod}
          type="button"
        >
          Mês atual
        </button>
      </div>
    </header>
  );
}
