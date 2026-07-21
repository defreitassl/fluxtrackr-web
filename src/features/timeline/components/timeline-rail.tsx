"use client";

import {
  ChartNoAxesColumn,
  Clock3,
  CreditCard,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import type { Account, Category, TimelineItem } from "@/api/generated/client";
import { getUtcDayKey } from "@/features/timeline/lib/timeline-date-range";
import { timelineItemView } from "@/features/timeline/lib/timeline-item-presentation";
import { formatCurrency } from "@/lib/format";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

function invoiceCardName(item: TimelineItem) {
  const card = item.metadata?.creditCard;
  if (card && typeof card === "object" && "name" in card && typeof card.name === "string") {
    return card.name;
  }
  return null;
}

type TimelineRailProps = {
  month: Date;
  items: TimelineItem[];
  today: Date;
  currentBalance: number | null;
  projectedFinalBalance: number | null;
  categoriesById: Map<string, Category>;
  accountsById: Map<string, Account>;
};

export function TimelineRail({
  month,
  items,
  today,
  currentBalance,
  projectedFinalBalance,
  categoriesById,
  accountsById,
}: TimelineRailProps) {
  const todayKey = getUtcDayKey(today.toISOString());
  const monthLabel = MONTHS[month.getUTCMonth()];
  const monthIsOver =
    new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1) - 1).toISOString().slice(0, 10) <
    todayKey;

  const projection = useMemo(() => {
    let income = 0;
    let expense = 0;
    let invoices = 0;
    for (const item of items) {
      if (item.balanceImpact !== "projected") continue;
      if (getUtcDayKey(item.date) < todayKey) continue;
      const amount = Number(item.amount);
      if (item.sourceType === "credit_card_invoice") invoices += amount;
      else if (item.type === "income") income += amount;
      else if (item.type === "expense") expense += amount;
    }
    return { income, expense, invoices };
  }, [items, todayKey]);

  const nextInvoice = useMemo(() => {
    const upcoming = items
      .filter(
        (item) =>
          item.sourceType === "credit_card_invoice" &&
          item.balanceImpact === "projected" &&
          getUtcDayKey(item.date) >= todayKey,
      )
      .sort((left, right) => left.date.localeCompare(right.date));
    return upcoming[0] ?? null;
  }, [items, todayKey]);

  const upcoming = useMemo(
    () =>
      items
        .filter((item) => item.balanceImpact === "projected" && getUtcDayKey(item.date) >= todayKey)
        .sort((left, right) => left.date.localeCompare(right.date))
        .slice(0, 4),
    [items, todayKey],
  );

  const invoiceDueInDays = nextInvoice
    ? Math.max(0, Math.ceil((new Date(nextInvoice.date).getTime() - today.getTime()) / DAY_IN_MS))
    : null;

  return (
    <aside className="tlx-rail" aria-label="Resumo da timeline">
      <div className="tlx-card">
        <div className="tlx-card-title">
          <ChartNoAxesColumn aria-hidden="true" color="var(--blue)" size={15} />
          Saldo projetado
        </div>
        <div className="tlx-projection-row">
          <span>Disponível hoje</span>
          <strong>{currentBalance === null ? "—" : formatCurrency(currentBalance)}</strong>
        </div>
        <div className="tlx-projection-breakdown">
          <div className="tlx-projection-line">
            <span>
              <TrendingUp aria-hidden="true" color="var(--green-strong)" size={15} />
              Entradas previstas
            </span>
            <strong className="tlx-value-green">+ {formatCurrency(projection.income)}</strong>
          </div>
          <div className="tlx-projection-line">
            <span>
              <TrendingDown aria-hidden="true" color="var(--danger)" size={15} />
              Saídas previstas
            </span>
            <strong className="tlx-value-red">− {formatCurrency(projection.expense)}</strong>
          </div>
          <div className="tlx-projection-line">
            <span>
              <CreditCard aria-hidden="true" color="var(--amber)" size={15} />
              Faturas a pagar
            </span>
            <strong className="tlx-value-amber">− {formatCurrency(projection.invoices)}</strong>
          </div>
        </div>
        {!monthIsOver && projectedFinalBalance !== null ? (
          <div className="tlx-projection-row tlx-projection-final">
            <span>Fim de {monthLabel}</span>
            <strong>{formatCurrency(projectedFinalBalance)}</strong>
          </div>
        ) : null}
        <p className="tlx-card-footnote">
          Projeção com base nos eventos previstos. Faturas de cartão só reduzem o saldo quando pagas.
        </p>
      </div>

      {nextInvoice && invoiceDueInDays !== null ? (
        <div className="tlx-invoice-alert">
          <div className="tlx-invoice-alert-head">
            <span>
              <CreditCard aria-hidden="true" size={15} />
            </span>
            <div>
              <strong>
                Fatura {invoiceCardName(nextInvoice) ?? "do cartão"} vence{" "}
                {invoiceDueInDays === 0 ? "hoje" : `em ${invoiceDueInDays} ${invoiceDueInDays === 1 ? "dia" : "dias"}`}
              </strong>
              <small>
                {dayMonthFormatter.format(new Date(nextInvoice.date))} ·{" "}
                {formatCurrency(Number(nextInvoice.amount))}
              </small>
            </div>
          </div>
          <p>
            O saldo da conta <strong>só será debitado quando você pagar</strong> a fatura, não a cada compra.
          </p>
          <Link className="tlx-invoice-alert-button" href="/wallet">
            Pagar fatura
          </Link>
        </div>
      ) : null}

      <div className="tlx-card tlx-upcoming">
        <div className="tlx-card-title tlx-upcoming-head">
          <Clock3 aria-hidden="true" size={15} />
          Próximos compromissos
        </div>
        {upcoming.length === 0 ? (
          <p className="tlx-upcoming-empty">Nenhum compromisso previsto neste período.</p>
        ) : (
          upcoming.map((item) => {
            const view = timelineItemView(item, categoriesById, accountsById);
            return (
              <div className="tlx-upcoming-row" key={item.id}>
                <span className={`tlx-tone-${view.tone}`}>
                  <view.Icon aria-hidden="true" size={15} />
                </span>
                <div className="tlx-upcoming-body">
                  <strong>{item.title}</strong>
                  <span>
                    {dayMonthFormatter.format(new Date(item.date))} · {view.metaParts[0]}
                  </span>
                </div>
                <strong className={view.valueTone === "text" ? undefined : `tlx-value-${view.valueTone}`}>
                  {view.value}
                </strong>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
