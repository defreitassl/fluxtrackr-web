"use client";

import { useMemo } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { BalanceEvolutionCard } from "@/features/dashboard/components/balance-evolution-card";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { FinanceCalendarCard } from "@/features/dashboard/components/finance-calendar-card";
import { HeroBalance } from "@/features/dashboard/components/hero-balance";
import { KpiTiles } from "@/features/dashboard/components/kpi-tiles";
import { MovementsCard } from "@/features/dashboard/components/movements-card";
import { NextInvoiceCard } from "@/features/dashboard/components/next-invoice-card";
import { UpcomingCommitmentsCard } from "@/features/dashboard/components/upcoming-commitments-card";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 30;

export function DashboardScreen() {
  const { data, isError, isFetching, isPending, isRefetchError, refetch } = useDashboardOverview();

  const refreshDashboard = () => {
    if (!isFetching) {
      void refetch({ cancelRefetch: false });
    }
  };

  const today = useMemo(() => (data ? new Date(data.asOf) : new Date()), [data]);

  const windows = useMemo(() => {
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1) - 1);
    const dayEnd = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1) - 1,
    );
    return {
      month: { startDate: monthStart.toISOString(), endDate: monthEnd.toISOString() },
      history: {
        startDate: new Date(dayEnd.getTime() - HISTORY_DAYS * DAY_IN_MS + 1).toISOString(),
        endDate: dayEnd.toISOString(),
      },
    };
  }, [today]);

  return (
    <section className="dashboard-screen" aria-label="Visão financeira">
      {isPending ? <DashboardSkeleton /> : null}

      {isError && !data ? (
        <ErrorState
          description="Não foi possível obter visão consolidada agora. Tente novamente em instantes."
          onRetry={refreshDashboard}
          title="Dashboard indisponível"
        />
      ) : null}

      {data ? (
        <>
          {isRefetchError ? (
            <div className="dashboard-refetch-alert" role="alert">
              <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
              <button className="secondary-button" onClick={refreshDashboard} type="button">
                Tentar novamente
              </button>
            </div>
          ) : null}

          <div className="dx-layout">
            <div className="dx-column">
              <HeroBalance balance={data.balance} />
              <KpiTiles overview={data} />
              <BalanceEvolutionCard
                currentBalance={Number(data.balance.total)}
                historyWindow={windows.history}
                today={today}
              />
              <MovementsCard monthWindow={windows.month} />
            </div>
            <div className="dx-side">
              <FinanceCalendarCard today={today} />
              <NextInvoiceCard invoice={data.nextInvoice} />
              <UpcomingCommitmentsCard commitments={data.upcomingCommitments} />
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
