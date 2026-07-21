"use client";

import { ChartNoAxesColumn, CreditCard, TrendingDown, TrendingUp } from "lucide-react";

import type { DashboardOverview } from "@/api/generated/client";
import { useTransactionMonthlySummary } from "@/features/transactions/queries/use-monthly-summary";
import { formatCurrency } from "@/lib/format";

type KpiTilesProps = {
  overview: DashboardOverview;
};

export function KpiTiles({ overview }: KpiTilesProps) {
  const asOf = new Date(overview.asOf);
  const { data: summary } = useTransactionMonthlySummary({
    year: asOf.getUTCFullYear(),
    month: asOf.getUTCMonth() + 1,
  });

  const income = summary ? summary.fixedIncomeTotal + summary.transactionIncomeTotal : null;
  const expense = summary ? summary.fixedExpenseTotal + summary.transactionExpenseTotal : null;

  const tiles = [
    {
      label: "Receitas",
      icon: <TrendingUp aria-hidden="true" color="var(--green-strong)" size={15} />,
      value: income === null ? "—" : formatCurrency(income),
    },
    {
      label: "Despesas",
      icon: <TrendingDown aria-hidden="true" color="var(--danger)" size={15} />,
      value: expense === null ? "—" : formatCurrency(expense),
    },
    {
      label: "Previsão 30d",
      icon: <ChartNoAxesColumn aria-hidden="true" color="var(--blue)" size={15} />,
      value: formatCurrency(overview.forecast30Days.projectedFinalBalance),
    },
    {
      label: "Meta hoje",
      icon: <CreditCard aria-hidden="true" color="var(--amber)" size={15} />,
      value: formatCurrency(overview.dailySpending.recommended),
    },
  ];

  return (
    <div className="dx-kpis">
      {tiles.map((tile) => (
        <div className="dx-kpi" key={tile.label}>
          <div className="dx-kpi-label">
            {tile.icon}
            {tile.label}
          </div>
          <strong>{tile.value}</strong>
        </div>
      ))}
    </div>
  );
}
