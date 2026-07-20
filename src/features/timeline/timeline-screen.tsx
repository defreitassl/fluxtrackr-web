"use client";

import { useMemo, useState } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { TimelineControls } from "@/features/timeline/components/timeline-controls";
import { TimelineList } from "@/features/timeline/components/timeline-list";
import { TimelineSkeleton } from "@/features/timeline/components/timeline-skeleton";
import { TimelineSummary } from "@/features/timeline/components/timeline-summary";
import {
  getUtcMonthRange,
  getUtcMonthStart,
  moveUtcMonth,
} from "@/features/timeline/lib/timeline-date-range";
import {
  type FinancialTimelineFilters,
  useFinancialTimeline,
} from "@/features/timeline/queries/use-financial-timeline";

const initialFilters: FinancialTimelineFilters = {
  includeCanceled: false,
};

export function TimelineScreen() {
  const [month, setMonth] = useState(() => getUtcMonthStart());
  const [filters, setFilters] = useState<FinancialTimelineFilters>(initialFilters);
  const range = useMemo(() => getUtcMonthRange(month), [month]);
  const params = useMemo(
    () => ({ ...range, ...filters, includeCanceled: filters.includeCanceled ?? false }),
    [filters, range],
  );
  const {
    data,
    isError,
    isFetching,
    isPending,
    isPlaceholderData,
    isRefetchError,
    refetch,
  } = useFinancialTimeline(params);
  const currentMonth = getUtcMonthStart();
  const isCurrentMonth = month.getTime() === currentMonth.getTime();
  const hasActiveFilters = Boolean(filters.type || filters.sourceType || filters.includeCanceled);

  const refreshTimeline = () => {
    if (!isFetching) {
      void refetch({ cancelRefetch: false });
    }
  };

  return (
    <section className="timeline-screen" aria-labelledby="timeline-title">
      <TimelineControls
        filters={filters}
        isCurrentMonth={isCurrentMonth}
        isFetching={isFetching}
        month={month}
        onChangeFilters={setFilters}
        onMoveMonth={(amount) => setMonth((current) => moveUtcMonth(current, amount))}
        onRefresh={refreshTimeline}
        onResetMonth={() => setMonth(getUtcMonthStart())}
      />

      {isPending && !data ? <TimelineSkeleton /> : null}

      {isError && !data ? (
        <ErrorState
          description="Não foi possível obter a Timeline agora. Tente novamente em instantes."
          onRetry={refreshTimeline}
          title="Timeline indisponível"
        />
      ) : null}

      {data ? (
        <div className="timeline-content" aria-busy={isFetching}>
          {isFetching && !isRefetchError ? (
            <p className="timeline-refreshing" role="status">
              {isPlaceholderData ? "Atualizando período ou filtros selecionados…" : "Atualizando Timeline…"}
            </p>
          ) : null}
          {isRefetchError ? (
            <div className="timeline-refetch-alert" role="alert">
              <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
              <button className="secondary-button" onClick={refreshTimeline} type="button">
                Tentar novamente
              </button>
            </div>
          ) : null}
          <TimelineSummary summary={data.summary} />
          <TimelineList
            hasActiveFilters={hasActiveFilters}
            items={data.items}
            onClearFilters={() => setFilters(initialFilters)}
          />
        </div>
      ) : null}
    </section>
  );
}
