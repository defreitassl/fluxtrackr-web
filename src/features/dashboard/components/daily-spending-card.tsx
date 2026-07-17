import type {
  DashboardOverviewDailySpending,
  DashboardOverviewDailySpendingStatus,
} from "@/api/generated/client";
import { formatCurrency } from "@/lib/format";

const dailySpendingStatusContent: Record<
  DashboardOverviewDailySpendingStatus,
  { label: string; description: string; tone: string }
> = {
  within_plan: {
    label: "Dentro do planejado",
    description: "Gasto de hoje dentro da meta informada pela API.",
    tone: "positive",
  },
  over_plan: {
    label: "Acima do planejado",
    description: "Gasto de hoje acima da meta informada pela API.",
    tone: "warning",
  },
  no_available_balance: {
    label: "Sem saldo disponível",
    description: "Não há valor disponível para uma meta diária.",
    tone: "danger",
  },
};

type DailySpendingCardProps = {
  dailySpending: DashboardOverviewDailySpending;
};

export function DailySpendingCard({ dailySpending }: DailySpendingCardProps) {
  const status = dailySpendingStatusContent[dailySpending.status];

  return (
    <section className="dashboard-card daily-spending-card" aria-labelledby="daily-spending-title">
      <div className="card-heading">
        <div>
          <p className="card-kicker">Hoje</p>
          <h2 id="daily-spending-title">Ritmo de gasto</h2>
        </div>
        <span className={`status-badge status-badge-${status.tone}`}>{status.label}</span>
      </div>
      <dl className="dashboard-metric-list">
        <div>
          <dt>Recomendado</dt>
          <dd>{formatCurrency(dailySpending.recommended)}</dd>
        </div>
        <div>
          <dt>Gasto hoje</dt>
          <dd>{formatCurrency(dailySpending.spentToday)}</dd>
        </div>
        <div>
          <dt>Restante hoje</dt>
          <dd>{formatCurrency(dailySpending.remainingToday)}</dd>
        </div>
      </dl>
      <p className="card-note">
        {dailySpending.daysRemainingInMonth} dias restantes neste mês. {status.description}
      </p>
    </section>
  );
}
