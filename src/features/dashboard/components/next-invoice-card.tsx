"use client";

import Link from "next/link";

import type { DashboardOverviewNextInvoice } from "@/api/generated/client";
import { useCreditCards } from "@/features/dashboard/queries/use-credit-cards";
import { formatCurrency } from "@/lib/format";

const dueFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

function cardMonogram(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type NextInvoiceCardProps = {
  invoice: DashboardOverviewNextInvoice;
};

export function NextInvoiceCard({ invoice }: NextInvoiceCardProps) {
  const { data: creditCards } = useCreditCards({ enabled: invoice !== null });

  if (!invoice) {
    return (
      <section className="dx-panel dx-side-card">
        <div className="dx-side-head">
          <h2>Próxima fatura</h2>
        </div>
        <p className="dx-empty">Nenhuma fatura em aberto no momento.</p>
      </section>
    );
  }

  const creditCard = creditCards?.find((card) => card.id === invoice.creditCardId);
  const limit = creditCard ? Number(creditCard.limitAmount) : null;
  const amount = Number(invoice.amount);
  const usage = limit && limit > 0 ? Math.min(100, (amount / limit) * 100) : null;

  return (
    <section className="dx-panel dx-side-card">
      <div className="dx-side-head">
        <h2>Próxima fatura</h2>
        <Link className="dx-panel-link" href="/wallet">
          Detalhes
        </Link>
      </div>

      <div className="dx-invoice-row">
        <div className="dx-invoice-logo" aria-hidden="true">
          {cardMonogram(invoice.creditCardName)}
        </div>
        <div>
          <strong>{invoice.creditCardName}</strong>
          <span className="dx-invoice-due">vence em {dueFormatter.format(new Date(invoice.dueDate))}</span>
        </div>
        <strong className="dx-invoice-amount">{formatCurrency(invoice.amount)}</strong>
      </div>

      {usage !== null ? (
        <>
          <div className="dx-progress" aria-hidden="true">
            <i style={{ width: `${usage}%` }} />
          </div>
          <div className="dx-progress-meta">
            <span>
              {formatCurrency(amount)} de {formatCurrency(limit ?? 0)}
            </span>
            {creditCard?.closingDay ? <span>Fecha dia {creditCard.closingDay}</span> : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
