import type { CreditCardInvoiceWithInstallments } from "@/api/generated/client";
import { formatUtcDate, getInvoiceStatusLabel } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type OrphanInvoicesProps = {
  invoices: CreditCardInvoiceWithInstallments[];
};

/**
 * Faturas cujo cartão não está na lista ativa. Ficam acessíveis, somente de
 * leitura, sem serem associadas ao cartão errado nem descartadas em silêncio.
 */
export function OrphanInvoices({ invoices }: OrphanInvoicesProps) {
  if (invoices.length === 0) {
    return null;
  }

  return (
    <div className="wallet-orphan-invoices" aria-labelledby="wallet-orphan-title">
      <div className="wallet-orphan-heading">
        <h3 id="wallet-orphan-title">Outras faturas do mês</h3>
        <span>{invoices.length} sem cartão ativo</span>
      </div>
      <ul>
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <div>
              <strong>Cartão arquivado ou indisponível</strong>
              <span>
                {String(invoice.month).padStart(2, "0")}/{invoice.year} ·{" "}
                {getInvoiceStatusLabel(invoice.status)} · vence {formatUtcDate(invoice.dueDate)}
              </span>
            </div>
            <strong>{formatCurrency(invoice.totalAmount)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
