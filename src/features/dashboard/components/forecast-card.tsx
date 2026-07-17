import { CalendarClock } from "lucide-react";

import type { DashboardOverviewForecast30Days } from "@/api/generated/client";
import { formatCurrency, formatDate } from "@/lib/format";

type ForecastCardProps = {
  forecast: DashboardOverviewForecast30Days;
};

export function ForecastCard({ forecast }: ForecastCardProps) {
  return (
    <section className="dashboard-card forecast-card" aria-labelledby="forecast-title">
      <div className="card-heading">
        <div>
          <p className="card-kicker">Próximos 30 dias</p>
          <h2 id="forecast-title">Previsão</h2>
        </div>
        <span className="card-icon" aria-hidden="true"><CalendarClock size={18} /></span>
      </div>
      <dl className="dashboard-metric-list">
        <div>
          <dt>Saldo projetado</dt>
          <dd>{formatCurrency(forecast.projectedFinalBalance)}</dd>
        </div>
        <div>
          <dt>Menor saldo</dt>
          <dd>{formatCurrency(forecast.minimumProjectedBalance)}</dd>
        </div>
      </dl>
      <p className="card-note">
        {forecast.firstNegativeDate
          ? `Primeiro saldo negativo em ${formatDate(forecast.firstNegativeDate)}.`
          : "Nenhum saldo negativo previsto neste período."}
      </p>
    </section>
  );
}
