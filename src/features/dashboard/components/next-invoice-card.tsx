import { CreditCard, ReceiptText } from "lucide-react";

import type { DashboardOverviewNextInvoice } from "@/api/generated/client";
import { getInvoiceStatusLabel } from "@/lib/financial-presentation";
import { formatCurrency, formatDate } from "@/lib/format";

type NextInvoiceCardProps = {
  invoice: DashboardOverviewNextInvoice;
};

export function NextInvoiceCard({ invoice }: NextInvoiceCardProps) {
  if (!invoice) {
    return (
      <section className="dashboard-card next-invoice-card invoice-empty" aria-labelledby="invoice-title">
        <div className="card-heading">
          <div>
            <p className="card-kicker">Cartões</p>
            <h2 id="invoice-title">Próxima fatura</h2>
          </div>
          <span className="card-icon" aria-hidden="true"><CreditCard size={18} /></span>
        </div>
        <div className="dashboard-inline-empty">
          <ReceiptText aria-hidden="true" size={18} />
          <p>Nenhuma próxima fatura com valor pendente.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-card next-invoice-card" aria-labelledby="invoice-title">
      <div className="card-heading">
        <div>
          <p className="card-kicker">Cartões</p>
          <h2 id="invoice-title">Próxima fatura</h2>
        </div>
        <span className="card-icon" aria-hidden="true"><CreditCard size={18} /></span>
      </div>
      <p className="invoice-card-name">{invoice.creditCardName}</p>
      <strong className="invoice-card-amount">{formatCurrency(invoice.amount)}</strong>
      <div className="invoice-details">
        <span>Vence em {formatDate(invoice.dueDate)}</span>
        <span>{getInvoiceStatusLabel(invoice.status)}</span>
        <span>{invoice.installmentsCount} parcelas</span>
      </div>
    </section>
  );
}
