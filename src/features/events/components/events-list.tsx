"use client";

import { CalendarClock, Repeat } from "lucide-react";

import type { Account, Category, CreditCard, FinancialEvent } from "@/api/generated/client";
import {
  canCancelEvent,
  canConfirmEvent,
  canEditEvent,
  canPostponeEvent,
  canRealizeEvent,
  eventRecurrenceLabel,
  eventStatusLabels,
  eventStatusTones,
  isRecurringEvent,
} from "@/features/events/lib/event-presentation";
import { paymentMethodLabel } from "@/features/transactions/lib/transaction-form";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDateTime } from "@/lib/format";

type EventsListProps = {
  events: FinancialEvent[];
  accountsById: Map<string, Account>;
  categoriesById: Map<string, Category>;
  creditCardsById: Map<string, CreditCard>;
  focusedId: string | null;
  onConfirm: (event: FinancialEvent) => void;
  onPostpone: (event: FinancialEvent) => void;
  onRealize: (event: FinancialEvent) => void;
  onEdit: (event: FinancialEvent) => void;
  onCancel: (event: FinancialEvent) => void;
};

export function EventsList({
  events,
  accountsById,
  categoriesById,
  creditCardsById,
  focusedId,
  onConfirm,
  onPostpone,
  onRealize,
  onEdit,
  onCancel,
}: EventsListProps) {
  return (
    <div className="evx-list">
      {events.map((event) => {
        const isIncome = event.type === "income";
        const account = event.accountId ? accountsById.get(event.accountId) : undefined;
        const creditCard = event.creditCardId ? creditCardsById.get(event.creditCardId) : undefined;
        const category = event.categoryId ? categoriesById.get(event.categoryId) : undefined;
        const isDone = event.status === "realized" || event.status === "canceled";

        const metaParts = [
          formatDateTime(event.date),
          account ? account.name : creditCard ? `Cartão ${creditCard.name}` : null,
          category?.name ?? null,
          event.paymentMethod ? paymentMethodLabel(event.paymentMethod) : null,
        ].filter((part): part is string => Boolean(part));

        return (
          <article
            aria-label={event.name}
            className={cn("evx-card", isDone && "evx-card-done", focusedId === event.id && "evx-focused")}
            data-event-id={event.id}
            key={event.id}
          >
            <div className="evx-card-main">
              <span className={cn("evx-card-icon", isIncome ? "tlx-tone-green" : "tlx-tone-blue")}>
                <CalendarClock aria-hidden="true" size={16} />
              </span>
              <div className="evx-card-body">
                <div className="evx-card-title">
                  <strong>{event.name}</strong>
                  <span className="evx-status-pill" data-tone={eventStatusTones[event.status]}>
                    {eventStatusLabels[event.status]}
                  </span>
                  {isRecurringEvent(event.recurrence) ? (
                    <span className="tlx-tag">
                      <Repeat aria-hidden="true" size={11} />
                      {eventRecurrenceLabel(event.recurrence)}
                    </span>
                  ) : null}
                  {event.installmentCount > 1 ? (
                    <span className="tlx-tag">{event.installmentCount}x</span>
                  ) : null}
                </div>
                <div className="evx-card-meta">
                  {metaParts.map((part, index) => (
                    <span key={`${part}-${index}`}>
                      {index > 0 ? <i className="tlx-meta-dot" aria-hidden="true" /> : null}
                      {part}
                    </span>
                  ))}
                </div>
                {event.notes ? <p className="evx-card-notes">{event.notes}</p> : null}
              </div>
              <strong className={cn("evx-card-value", isIncome ? "tlx-value-green" : "tlx-value-red")}>
                {isIncome ? "+ " : "− "}
                {formatCurrency(event.expectedAmount)}
              </strong>
            </div>

            {isDone ? null : (
              <div className="evx-card-actions">
                {canConfirmEvent(event.status) ? (
                  <button className="txx-chip" onClick={() => onConfirm(event)} type="button">
                    Confirmar
                  </button>
                ) : null}
                {canRealizeEvent(event.status) ? (
                  <button
                    className="txx-chip evx-action-primary"
                    onClick={() => onRealize(event)}
                    type="button"
                  >
                    Realizar
                  </button>
                ) : (
                  <button
                    className="txx-chip"
                    disabled
                    title="Confirme o evento primeiro"
                    type="button"
                  >
                    Realizar
                  </button>
                )}
                {canPostponeEvent(event.status) ? (
                  <button className="txx-chip" onClick={() => onPostpone(event)} type="button">
                    Adiar
                  </button>
                ) : null}
                {canEditEvent(event.status) ? (
                  <button className="txx-chip" onClick={() => onEdit(event)} type="button">
                    Editar
                  </button>
                ) : null}
                {canCancelEvent(event.status) ? (
                  <button className="txx-chip evx-action-danger" onClick={() => onCancel(event)} type="button">
                    Cancelar
                  </button>
                ) : null}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
