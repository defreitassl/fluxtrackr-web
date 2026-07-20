"use client";

import { RefreshCw } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { BalanceSummary } from "@/features/dashboard/components/balance-summary";
import { BudgetSummaryCard } from "@/features/dashboard/components/budget-summary-card";
import { DailySpendingCard } from "@/features/dashboard/components/daily-spending-card";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { ForecastCard } from "@/features/dashboard/components/forecast-card";
import { NextInvoiceCard } from "@/features/dashboard/components/next-invoice-card";
import { RecentMovements } from "@/features/dashboard/components/recent-movements";
import { UpcomingCommitments } from "@/features/dashboard/components/upcoming-commitments";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { formatDateTime } from "@/lib/format";

export function DashboardScreen() {
  const { data, isError, isFetching, isPending, isRefetchError, refetch } = useDashboardOverview();

  const refreshDashboard = () => {
    if (!isFetching) {
      void refetch({ cancelRefetch: false });
    }
  };

  return (
    <section className="dashboard-screen" aria-labelledby="dashboard-title">
      <header className="dashboard-page-header">
        <div>
          <p className="page-eyebrow">Visão geral</p>
          <h1 id="dashboard-title">Dashboard</h1>
          <p>Acompanhe valores consolidados, próximos compromissos e cenário dos próximos dias.</p>
        </div>
        <button
          aria-label="Atualizar Dashboard"
          className="secondary-button dashboard-refresh-button"
          disabled={isFetching}
          onClick={refreshDashboard}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={isFetching ? "is-spinning" : undefined} size={16} />
          {isFetching && !isPending ? "Atualizando…" : "Atualizar"}
        </button>
      </header>

      {isPending ? <DashboardSkeleton /> : null}

      {isError && !data ? (
        <ErrorState
          description="Não foi possível obter visão consolidada agora. Tente novamente em instantes."
          onRetry={refreshDashboard}
          title="Dashboard indisponível"
        />
      ) : null}

      {data ? (
        <div className="dashboard-content">
          <p className="dashboard-as-of">Última consolidação: {formatDateTime(data.asOf)}</p>
          {isRefetchError ? (
            <div className="dashboard-refetch-alert" role="alert">
              <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
              <button className="secondary-button" onClick={refreshDashboard} type="button">
                Tentar novamente
              </button>
            </div>
          ) : null}
          <BalanceSummary balance={data.balance} />
          <div className="dashboard-primary-grid">
            <DailySpendingCard dailySpending={data.dailySpending} />
          </div>
          <div className="dashboard-secondary-grid">
            <ForecastCard forecast={data.forecast30Days} />
            <BudgetSummaryCard budgetSummary={data.budgetSummary} />
            <NextInvoiceCard invoice={data.nextInvoice} />
          </div>
          <UpcomingCommitments commitments={data.upcomingCommitments} />
          <RecentMovements movements={data.latestMovements} />
        </div>
      ) : null}
    </section>
  );
}
