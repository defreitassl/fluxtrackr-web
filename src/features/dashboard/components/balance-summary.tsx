import type { DashboardOverviewBalance } from "@/api/generated/client";
import { formatCurrency } from "@/lib/format";

type BalanceSummaryProps = {
  balance: DashboardOverviewBalance;
};

export function BalanceSummary({ balance }: BalanceSummaryProps) {
  return (
    <section className="dashboard-balance-card" aria-labelledby="balance-title">
      <div className="balance-card-topline">
        <p>Panorama financeiro</p>
        <span>Consolidado pela API</span>
      </div>
      <h2 id="balance-title">Saldo total</h2>
      <strong className="balance-total">{formatCurrency(balance.total)}</strong>
      <dl className="balance-breakdown">
        <div>
          <dt>Comprometido</dt>
          <dd>{formatCurrency(balance.committed)}</dd>
        </div>
        <div>
          <dt>Disponível para gastar</dt>
          <dd>{formatCurrency(balance.availableToSpend)}</dd>
        </div>
      </dl>
    </section>
  );
}
