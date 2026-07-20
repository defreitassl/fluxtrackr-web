import { ArrowDownRight, ArrowUpRight, ChartNoAxesCombined, ReceiptText } from "lucide-react";

import type { FinancialTimelineSummary } from "@/api/generated/client";
import { formatCurrency } from "@/lib/format";

type TimelineSummaryProps = {
  summary: FinancialTimelineSummary;
};

const summaryItems = [
  { key: "realizedIncome", label: "Receitas realizadas", icon: ArrowUpRight, tone: "positive" },
  { key: "realizedExpense", label: "Despesas realizadas", icon: ArrowDownRight, tone: "negative" },
  { key: "projectedIncome", label: "Receitas projetadas", icon: ChartNoAxesCombined, tone: "positive" },
  { key: "projectedExpense", label: "Despesas projetadas", icon: ReceiptText, tone: "negative" },
] as const;

export function TimelineSummary({ summary }: TimelineSummaryProps) {
  return (
    <section aria-labelledby="timeline-summary-title">
      <div className="timeline-section-heading">
        <div>
          <p className="page-eyebrow">Resumo do período</p>
          <h2 id="timeline-summary-title">Impactos retornados pela API</h2>
        </div>
      </div>
      <dl className="timeline-summary-grid">
        {summaryItems.map(({ icon: Icon, key, label, tone }) => (
          <div className={`timeline-summary-card timeline-summary-card-${tone}`} key={key}>
            <dt>
              <span className="timeline-summary-icon" aria-hidden="true"><Icon size={17} /></span>
              {label}
            </dt>
            <dd>{formatCurrency(summary[key])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
