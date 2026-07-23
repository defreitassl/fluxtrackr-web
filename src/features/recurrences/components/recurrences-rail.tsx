"use client";

import { CalendarCheck2, CreditCard, RotateCcw, TriangleAlert, Wallet } from "lucide-react";
import { useState } from "react";

import type { Account, Category, CreditCard as CreditCardType } from "@/api/generated/client";
import type { RecurrenceRailItem } from "@/features/recurrences/lib/recurrence-presentation";
import {
  resolveRecurrenceCategory,
  resolveRecurrenceDestination,
} from "@/features/recurrences/lib/recurrence-presentation";
import { formatCurrency } from "@/lib/format";
import { formatUtcDate } from "@/features/wallet/lib/wallet-presentation";

type RecurrencesRailProps = {
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCardType[];
  isError: boolean;
  isPending: boolean;
  items: RecurrenceRailItem[];
  onCancel: (item: RecurrenceRailItem) => void;
  onRealize: (item: RecurrenceRailItem) => void;
  onRetry: () => void;
};

export function RecurrencesRail({
  accounts,
  categories,
  creditCards,
  isError,
  isPending,
  items,
  onCancel,
  onRealize,
  onRetry,
}: RecurrencesRailProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.slice(0, 8);

  return (
    <aside className="rcx-rail" aria-label="Próximas cobranças">
      <div className="rcx-rail-head">
        <div>
          <span>PRÓXIMAS COBRANÇAS</span>
          <strong>Hoje até os próximos 45 dias</strong>
        </div>
        <CalendarCheck2 aria-hidden="true" size={18} />
      </div>

      {isPending ? (
        <div aria-busy="true" className="rcx-rail-skeleton" role="status"><span /><span /><span /></div>
      ) : null}

      {isError && !isPending ? (
        <div className="rcx-rail-state" role="alert">
          <TriangleAlert aria-hidden="true" size={18} />
          <p>Não foi possível carregar as pendências.</p>
          <button onClick={onRetry} type="button"><RotateCcw aria-hidden="true" size={13} /> Tentar novamente</button>
        </div>
      ) : null}

      {!isPending && !isError && items.length === 0 ? (
        <div className="rcx-rail-state">
          <CalendarCheck2 aria-hidden="true" size={18} />
          <p>Nenhuma cobrança ou ocorrência pendente neste período.</p>
        </div>
      ) : null}

      {!isPending && !isError ? (
        <div className="rcx-rail-list">
          {visibleItems.map((item) => {
            const isCreditCard = Boolean(item.creditCardId);
            return (
              <article className="rcx-rail-item" key={`${item.source}-${item.id}`}>
                <span className="rcx-rail-item-icon">
                  {isCreditCard ? <CreditCard aria-hidden="true" size={15} /> : <Wallet aria-hidden="true" size={15} />}
                </span>
                <div className="rcx-rail-item-copy">
                  <strong>{item.name}</strong>
                  <span>{formatUtcDate(item.date)} · {item.source === "subscription" ? "Assinatura" : item.type === "expense" ? "Gasto fixo" : "Renda fixa"}</span>
                  <small>{resolveRecurrenceDestination(item, accounts, creditCards)} · {resolveRecurrenceCategory(item.categoryId, categories)}</small>
                </div>
                <b className={item.type === "income" ? "rcx-income" : ""}>{formatCurrency(item.amount)}</b>
                <div className="rcx-rail-actions">
                  <button onClick={() => onRealize(item)} type="button">Realizar</button>
                  <button aria-label={`Cancelar ${item.name}`} className="rcx-rail-cancel" onClick={() => onCancel(item)} type="button">Cancelar</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {items.length > 8 ? (
        <button className="rcx-show-all" onClick={() => setShowAll((current) => !current)} type="button">
          {showAll ? "Mostrar menos" : `Ver todas (${items.length})`}
        </button>
      ) : null}
    </aside>
  );
}
