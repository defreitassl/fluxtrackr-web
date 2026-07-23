"use client";

import Link from "next/link";

import type { DashboardOverviewUpcomingCommitmentsItem } from "@/api/generated/client";
import { formatSignedCurrency } from "@/features/dashboard/lib/dashboard-format";

const sourceLabels: Record<string, string> = {
  fixed_expense: "Gasto fixo",
  fixed_income: "Receita fixa",
  subscription: "Assinatura",
  financial_event: "Evento financeiro",
  credit_card_invoice: "Cartão · agrupada",
  transaction: "Transação",
  account_transfer: "Transferência",
  account_balance_adjustment: "Ajuste de saldo",
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

type UpcomingCommitmentsCardProps = {
  commitments: DashboardOverviewUpcomingCommitmentsItem[];
};

export function UpcomingCommitmentsCard({ commitments }: UpcomingCommitmentsCardProps) {
  return (
    <section className="dx-panel dx-side-card">
      <div className="dx-side-head">
        <h2>Próximos compromissos</h2>
        <Link className="dx-panel-link" href="/timeline">
          Timeline
        </Link>
      </div>

      {commitments.length === 0 ? (
        <p className="dx-empty">Nenhum compromisso nos próximos 30 dias.</p>
      ) : (
        <div className="dx-commitments">
          {commitments.map((commitment) => {
            const date = new Date(commitment.date);
            const isIncome = commitment.type === "income";
            const isInvoice = commitment.sourceType === "credit_card_invoice";
            const blockVariant = isInvoice
              ? "dx-date-block-invoice"
              : isIncome
                ? "dx-date-block-income"
                : "";
            return (
              <div className="dx-commitment" key={commitment.id}>
                <div className={`dx-date-block ${blockVariant}`.trim()}>
                  <span>{monthFormatter.format(date).replace(".", "")}</span>
                  <strong>{date.getUTCDate()}</strong>
                </div>
                <div className="dx-commitment-info">
                  {commitment.sourceType === "financial_event" ? (
                    <Link className="evx-source-link" href={`/events?focus=${commitment.sourceId}`}>
                      <strong>{commitment.title}</strong>
                    </Link>
                  ) : (
                    <strong>{commitment.title}</strong>
                  )}
                  <span>
                    {sourceLabels[commitment.sourceType] ?? commitment.sourceType}
                    {isIncome ? " · Receita esperada" : ""}
                  </span>
                </div>
                <span className={`dx-amount ${isIncome ? "dx-amount-positive" : "dx-amount-negative"}`}>
                  {formatSignedCurrency(commitment.amount, isIncome ? "positive" : "negative")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
