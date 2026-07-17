import { WalletCards } from "lucide-react";

import type { BudgetSummary } from "@/api/generated/client";
import { formatCurrency } from "@/lib/format";

type BudgetSummaryCardProps = {
  budgetSummary: BudgetSummary;
};

export function BudgetSummaryCard({ budgetSummary }: BudgetSummaryCardProps) {
  return (
    <section className="dashboard-card budget-summary-card" aria-labelledby="budget-title">
      <div className="card-heading">
        <div>
          <p className="card-kicker">Mês atual</p>
          <h2 id="budget-title">Orçamentos</h2>
        </div>
        <span className="card-icon" aria-hidden="true"><WalletCards size={18} /></span>
      </div>
      <dl className="dashboard-metric-list">
        <div>
          <dt>Limite total</dt>
          <dd>{formatCurrency(budgetSummary.totalLimit)}</dd>
        </div>
        <div>
          <dt>Total gasto</dt>
          <dd>{formatCurrency(budgetSummary.totalSpent)}</dd>
        </div>
        <div>
          <dt>Total restante</dt>
          <dd>{formatCurrency(budgetSummary.totalRemaining)}</dd>
        </div>
      </dl>
      <p className="card-note">
        {budgetSummary.nearLimitCount} próximos do limite · {budgetSummary.exceededCount} excedidos
      </p>
    </section>
  );
}
