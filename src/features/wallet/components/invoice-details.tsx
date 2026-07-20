import { ReceiptText } from "lucide-react";

import type { CreditCard, CreditCardInvoiceWithInstallments } from "@/api/generated/client";
import { InlineEmpty } from "@/features/wallet/components/wallet-empty-states";
import {
  formatUnknownStatus,
  formatUtcDate,
  getInvoiceStatusLabel,
} from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type InvoiceDetailsProps = {
  selectedCard: CreditCard | undefined;
  cardInvoices: CreditCardInvoiceWithInstallments[];
  selectedInvoice: CreditCardInvoiceWithInstallments | undefined;
  onSelectInvoice: (id: string) => void;
};

export function InvoiceDetails({
  selectedCard,
  cardInvoices,
  selectedInvoice,
  onSelectInvoice,
}: InvoiceDetailsProps) {
  if (!selectedCard) {
    return <InlineEmpty icon={ReceiptText} message="Selecione um cartão para ver as faturas." />;
  }

  return (
    <aside className="wallet-detail-panel wallet-invoice-panel" aria-labelledby="invoice-detail-title">
      <p className="page-eyebrow">Cartão selecionado</p>
      <h3 id="invoice-detail-title">{selectedCard.name}</h3>

      {cardInvoices.length === 0 || !selectedInvoice ? (
        <InlineEmpty
          icon={ReceiptText}
          message="Este cartão não possui fatura no mês UTC atual."
        />
      ) : (
        <>
          {cardInvoices.length > 1 ? (
            <div className="wallet-invoice-selector" aria-label="Faturas do cartão selecionado">
              {cardInvoices.map((invoice) => (
                <button
                  aria-pressed={invoice.id === selectedInvoice.id}
                  key={invoice.id}
                  onClick={() => onSelectInvoice(invoice.id)}
                  type="button"
                >
                  {invoice.month}/{invoice.year} · {formatCurrency(invoice.totalAmount)}
                </button>
              ))}
            </div>
          ) : null}

          <dl className="wallet-breakdown-list">
            <div>
              <dt>Período</dt>
              <dd>
                {String(selectedInvoice.month).padStart(2, "0")}/{selectedInvoice.year}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{getInvoiceStatusLabel(selectedInvoice.status)}</dd>
            </div>
            <div>
              <dt>Total da fatura</dt>
              <dd>{formatCurrency(selectedInvoice.totalAmount)}</dd>
            </div>
            {selectedInvoice.closingDate ? (
              <div>
                <dt>Fechamento</dt>
                <dd>{formatUtcDate(selectedInvoice.closingDate)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Vencimento</dt>
              <dd>{formatUtcDate(selectedInvoice.dueDate)}</dd>
            </div>
            {selectedInvoice.paidAt ? (
              <div>
                <dt>Pagamento</dt>
                <dd>{formatUtcDate(selectedInvoice.paidAt)}</dd>
              </div>
            ) : null}
            {selectedInvoice.paidAmount ? (
              <div>
                <dt>Valor pago</dt>
                <dd>{formatCurrency(selectedInvoice.paidAmount)}</dd>
              </div>
            ) : null}
          </dl>

          <div className="wallet-installments">
            <div className="wallet-installments-heading">
              <h4>Parcelas</h4>
              <span>{selectedInvoice.installments.length} retornadas</span>
            </div>
            {selectedInvoice.installments.length === 0 ? (
              <p>Nenhuma parcela foi retornada para esta fatura.</p>
            ) : (
              <ul>
                {selectedInvoice.installments.map((installment) => (
                  <li key={installment.id}>
                    <div>
                      <strong>{installment.description}</strong>
                      <span>
                        {installment.installmentNumber} de {installment.installmentCount} · vence{" "}
                        {formatUtcDate(installment.dueDate)}
                      </span>
                    </div>
                    <div>
                      <strong>{formatCurrency(installment.installmentAmount)}</strong>
                      <span>{formatUnknownStatus(installment.status)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
