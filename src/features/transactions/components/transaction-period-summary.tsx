import type { MonthlySummary } from "@/api/generated/client";
import { formatCurrency } from "@/lib/format";

type TransactionPeriodSummaryProps = {
  periodLabel: string;
  summary?: MonthlySummary;
  isLoading: boolean;
  isError: boolean;
};

export function TransactionPeriodSummary({ periodLabel, summary, isLoading, isError }: TransactionPeriodSummaryProps) {
  return (
    <section aria-labelledby="transactions-summary-title" className="transaction-period-summary">
      <div className="transaction-period-summary-heading">
        <div>
          <p className="page-eyebrow">Resumo mensal</p>
          <h2 id="transactions-summary-title">{periodLabel}</h2>
        </div>
        <p>Valores consolidados pela API.</p>
      </div>
      {isLoading && !summary ? <div className="transaction-summary-skeleton" aria-label="Carregando resumo mensal" role="status"><span /><span /><span /></div> : null}
      {isError && !summary ? <p className="transaction-summary-error" role="alert">Não foi possível carregar o resumo mensal.</p> : null}
      {summary ? <dl className="transaction-summary-metrics">
        <div><dt>Receitas lançadas</dt><dd>{formatCurrency(summary.transactionIncomeTotal)}</dd></div>
        <div><dt>Despesas lançadas</dt><dd>{formatCurrency(summary.transactionExpenseTotal)}</dd></div>
        <div><dt>Saldo disponível</dt><dd>{formatCurrency(summary.availableBalance)}</dd></div>
      </dl> : null}
    </section>
  );
}
