"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Account, Category } from "@/api/generated/client";
import { useBalanceForecast } from "@/features/dashboard/queries/use-balance-forecast";
import { TimelineCalendarView } from "@/features/timeline/components/timeline-calendar-view";
import { TimelineRail } from "@/features/timeline/components/timeline-rail";
import { TimelineSkeleton } from "@/features/timeline/components/timeline-skeleton";
import { TimelineToolbar, type TimelineView } from "@/features/timeline/components/timeline-toolbar";
import { TimelineTrackView } from "@/features/timeline/components/timeline-track-view";
import {
  getUtcDayKey,
  getUtcMonthRange,
  getUtcMonthStart,
  moveUtcMonth,
} from "@/features/timeline/lib/timeline-date-range";
import {
  matchesChipFilter,
  type TimelineChipFilter,
} from "@/features/timeline/lib/timeline-item-presentation";
import { useFinancialTimeline } from "@/features/timeline/queries/use-financial-timeline";
import {
  listTransactionAccountsData,
  listTransactionCategoriesData,
} from "@/features/transactions/api/transactions";
import { ApiError } from "@/lib/http";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function monthKeyOf(month: Date) {
  return `${month.getUTCFullYear()}-${month.getUTCMonth() + 1}`;
}

export function TimelineScreen() {
  const [view, setView] = useState<TimelineView>("calendar");
  const [filter, setFilter] = useState<TimelineChipFilter>("all");
  const [showForecast, setShowForecast] = useState(true);
  const [month, setMonth] = useState(() => getUtcMonthStart());
  const [selection, setSelection] = useState<{ monthKey: string; day: number } | null>(null);

  const today = useMemo(() => new Date(), []);
  const range = useMemo(() => getUtcMonthRange(month), [month]);

  const timeline = useFinancialTimeline({ ...range, includeCanceled: false });
  const categories = useQuery<Category[], ApiError>({
    queryKey: ["transaction-categories"],
    queryFn: listTransactionCategoriesData,
    retry: false,
  });
  const accounts = useQuery<Account[], ApiError>({
    queryKey: ["transaction-accounts"],
    queryFn: listTransactionAccountsData,
    retry: false,
  });

  const monthEnd = useMemo(
    () => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1) - 1),
    [month],
  );
  const todayStart = useMemo(
    () => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
    [today],
  );
  const horizonDays = Math.max(
    1,
    Math.min(366, Math.ceil((monthEnd.getTime() - todayStart.getTime()) / DAY_IN_MS)),
  );
  const forecast = useBalanceForecast(horizonDays);

  const categoriesById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  );
  const accountsById = useMemo(
    () => new Map((accounts.data ?? []).map((account) => [account.id, account])),
    [accounts.data],
  );

  const visibleItems = useMemo(() => {
    const items = timeline.data?.items ?? [];
    return items.filter((item) => {
      if (item.balanceImpact === "none") return false;
      if (!showForecast && item.balanceImpact === "projected") return false;
      return matchesChipFilter(item, filter);
    });
  }, [timeline.data, filter, showForecast]);

  const isCurrentMonth =
    month.getUTCFullYear() === today.getUTCFullYear() && month.getUTCMonth() === today.getUTCMonth();

  const selectedDay = useMemo(() => {
    if (selection && selection.monthKey === monthKeyOf(month)) return selection.day;
    if (isCurrentMonth) return today.getUTCDate();
    const firstEventDay = visibleItems
      .map((item) => Number(getUtcDayKey(item.date).slice(8, 10)))
      .sort((left, right) => left - right)[0];
    return firstEventDay ?? 1;
  }, [selection, month, isCurrentMonth, today, visibleItems]);

  const refreshTimeline = () => {
    if (!timeline.isFetching) {
      void timeline.refetch({ cancelRefetch: false });
    }
  };

  const currentBalance = forecast.data ? Number(forecast.data.currentBalance) : null;

  return (
    <section className="tlx-screen" aria-label="Timeline financeira">
      <TimelineToolbar
        filter={filter}
        onChangeFilter={setFilter}
        onChangeView={setView}
        onToggleForecast={() => setShowForecast((value) => !value)}
        showForecast={showForecast}
        view={view}
      />

      <div className="tlx-body">
        <div className="tlx-main">
          {timeline.isRefetchError ? (
            <div className="timeline-refetch-alert tlx-refetch-alert" role="alert">
              <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
              <button className="secondary-button" onClick={refreshTimeline} type="button">
                Tentar novamente
              </button>
            </div>
          ) : null}

          {timeline.isPending ? <TimelineSkeleton /> : null}

          {timeline.isError && !timeline.data ? (
            <div className="tlx-state" role="alert">
              <div>
                <span className="tlx-state-icon tlx-tone-red">
                  <TriangleAlert aria-hidden="true" size={24} />
                </span>
                <strong>Falha ao carregar a timeline</strong>
                <p>Verifique a conexão. O período selecionado foi preservado.</p>
                <button className="tlx-state-retry" onClick={refreshTimeline} type="button">
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : null}

          {timeline.data ? (
            view === "calendar" ? (
              <TimelineCalendarView
                accountsById={accountsById}
                categoriesById={categoriesById}
                items={visibleItems}
                month={month}
                onMoveMonth={(amount) => {
                  setMonth((current) => moveUtcMonth(current, amount));
                  setSelection(null);
                }}
                onMoveYear={(amount) => {
                  setMonth((current) => moveUtcMonth(current, amount * 12));
                  setSelection(null);
                }}
                onResetToday={() => {
                  setMonth(getUtcMonthStart());
                  setSelection(null);
                }}
                onSelectDay={(day) => setSelection({ monthKey: monthKeyOf(month), day })}
                selectedDay={selectedDay}
                today={today}
              />
            ) : visibleItems.length === 0 ? (
              <div className="tlx-state">
                <div>
                  <span className="tlx-state-icon tlx-tone-green">
                    <CalendarDays aria-hidden="true" size={24} />
                  </span>
                  <strong>Nenhum evento neste período</strong>
                  <p>Registre movimentações ou gastos fixos para vê-los na linha do tempo.</p>
                  <Link className="tlx-state-cta" href="/transactions">
                    <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
                    Nova movimentação
                  </Link>
                </div>
              </div>
            ) : (
              <TimelineTrackView
                accountsById={accountsById}
                categoriesById={categoriesById}
                currentBalance={isCurrentMonth ? currentBalance : null}
                items={visibleItems}
                today={today}
              />
            )
          ) : null}
        </div>

        <TimelineRail
          accountsById={accountsById}
          categoriesById={categoriesById}
          currentBalance={currentBalance}
          items={timeline.data?.items ?? []}
          month={month}
          projectedFinalBalance={forecast.data ? Number(forecast.data.projectedFinalBalance) : null}
          today={today}
        />
      </div>
    </section>
  );
}
