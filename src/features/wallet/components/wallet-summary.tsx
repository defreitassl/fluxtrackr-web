import type { DashboardOverview } from "@/api/generated/client";
import { formatCurrency } from "@/lib/format";

type WalletSummaryProps = {
  accountCount: number;
  cardCount: number;
  invoiceCount: number;
  dashboard: DashboardOverview | undefined;
  isDashboardLoading: boolean;
  isDashboardUnavailable: boolean;
};

/**
 * Panorama financeiro com três estados distintos de Dashboard: carregando,
 * disponível e indisponível. O carregamento nunca é tratado como ausência de
 * fatura nem como indisponibilidade.
 */
export function WalletSummary({
  accountCount,
  cardCount,
  invoiceCount,
  dashboard,
  isDashboardLoading,
  isDashboardUnavailable,
}: WalletSummaryProps) {
  return (
    <section className="wallet-summary" aria-label="Panorama da Carteira">
      <div className="wallet-summary-main">
        <p>Panorama financeiro</p>
        {dashboard ? (
          <strong>{formatCurrency(dashboard.balance.total)}</strong>
        ) : (
          <span className="wallet-summary-unavailable">
            {isDashboardLoading ? "Carregando panorama…" : "Panorama indisponível"}
          </span>
        )}
        <span>{mainCaption({ dashboard, isDashboardLoading })}</span>
      </div>
      <dl className="wallet-summary-metrics">
        <div>
          <dt>Disponível para gastar</dt>
          <dd>{availableToSpend({ dashboard, isDashboardLoading })}</dd>
        </div>
        <div>
          <dt>Próxima fatura</dt>
          <dd>{nextInvoice({ dashboard, isDashboardLoading, isDashboardUnavailable })}</dd>
        </div>
        <div>
          <dt>Itens ativos</dt>
          <dd>
            {accountCount} contas · {cardCount} cartões · {invoiceCount} faturas
          </dd>
        </div>
      </dl>
    </section>
  );
}

function mainCaption({
  dashboard,
  isDashboardLoading,
}: {
  dashboard: DashboardOverview | undefined;
  isDashboardLoading: boolean;
}) {
  if (dashboard) {
    return "Saldo total calculado pela API";
  }
  if (isDashboardLoading) {
    return "Buscando o saldo consolidado pela API.";
  }
  return "As contas e cartões continuam disponíveis abaixo.";
}

function availableToSpend({
  dashboard,
  isDashboardLoading,
}: {
  dashboard: DashboardOverview | undefined;
  isDashboardLoading: boolean;
}) {
  if (dashboard) {
    return formatCurrency(dashboard.balance.availableToSpend);
  }
  return isDashboardLoading ? "Carregando…" : "—";
}

function nextInvoice({
  dashboard,
  isDashboardLoading,
  isDashboardUnavailable,
}: {
  dashboard: DashboardOverview | undefined;
  isDashboardLoading: boolean;
  isDashboardUnavailable: boolean;
}) {
  if (dashboard) {
    return dashboard.nextInvoice ? formatCurrency(dashboard.nextInvoice.amount) : "Sem próxima fatura";
  }
  if (isDashboardLoading) {
    return "Carregando…";
  }
  if (isDashboardUnavailable) {
    return "Indisponível";
  }
  return "—";
}
