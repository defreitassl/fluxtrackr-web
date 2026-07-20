import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw, SlidersHorizontal } from "lucide-react";

import type {
  FinancialTimelineSourceType,
  FinancialTimelineType,
} from "@/api/generated/client";
import type { FinancialTimelineFilters } from "@/features/timeline/queries/use-financial-timeline";
import {
  timelineSourceOptions,
  timelineTypeOptions,
} from "@/features/timeline/queries/use-financial-timeline";
import { formatUtcMonth } from "@/features/timeline/lib/timeline-date-range";

type TimelineControlsProps = {
  filters: FinancialTimelineFilters;
  isCurrentMonth: boolean;
  isFetching: boolean;
  month: Date;
  onChangeFilters: (filters: FinancialTimelineFilters) => void;
  onMoveMonth: (amount: number) => void;
  onResetMonth: () => void;
  onRefresh: () => void;
};

export function TimelineControls({
  filters,
  isCurrentMonth,
  isFetching,
  month,
  onChangeFilters,
  onMoveMonth,
  onResetMonth,
  onRefresh,
}: TimelineControlsProps) {
  return (
    <>
      <header className="timeline-page-header">
        <div>
          <p className="page-eyebrow">Planejamento</p>
          <h1 id="timeline-title">Timeline financeira</h1>
          <p>Movimentações realizadas e compromissos futuros organizados pela API em sequência cronológica.</p>
        </div>
        <button
          aria-label="Atualizar Timeline"
          className="secondary-button timeline-refresh-button"
          disabled={isFetching}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={isFetching ? "is-spinning" : undefined} size={16} />
          {isFetching ? "Atualizando…" : "Atualizar"}
        </button>
      </header>

      <section className="timeline-toolbar" aria-label="Período e filtros da Timeline">
        <div className="timeline-month-navigation" aria-label="Navegação mensal">
          <button
            aria-label="Mês anterior"
            className="icon-button"
            onClick={() => onMoveMonth(-1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <div className="timeline-month-label" aria-live="polite">
            <span>Período selecionado</span>
            <strong>{formatUtcMonth(month)}</strong>
          </div>
          <button
            aria-label="Próximo mês"
            className="icon-button"
            onClick={() => onMoveMonth(1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
          <button
            className="secondary-button timeline-current-month-button"
            disabled={isCurrentMonth}
            onClick={onResetMonth}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={15} />
            Mês atual
          </button>
        </div>

        <div className="timeline-filters">
          <span className="timeline-filter-title">
            <SlidersHorizontal aria-hidden="true" size={15} />
            Filtros
          </span>
          <label>
            <span>Tipo</span>
            <select
              onChange={(event) =>
                onChangeFilters({
                  ...filters,
                  type: (event.target.value || undefined) as FinancialTimelineType | undefined,
                })
              }
              value={filters.type ?? ""}
            >
              <option value="">Todos</option>
              {timelineTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Origem</span>
            <select
              onChange={(event) =>
                onChangeFilters({
                  ...filters,
                  sourceType: (event.target.value || undefined) as FinancialTimelineSourceType | undefined,
                })
              }
              value={filters.sourceType ?? ""}
            >
              <option value="">Todas</option>
              {timelineSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="timeline-canceled-filter">
            <input
              checked={filters.includeCanceled ?? false}
              onChange={(event) =>
                onChangeFilters({ ...filters, includeCanceled: event.target.checked })
              }
              type="checkbox"
            />
            <span>Incluir cancelados</span>
          </label>
        </div>
      </section>
    </>
  );
}
