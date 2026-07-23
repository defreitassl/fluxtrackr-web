"use client";

import { CalendarClock, CheckCircle2, CreditCard, ReceiptText } from "lucide-react";
import { useState } from "react";

import type {
  Account,
  CreditCard as CreditCardModel,
  FinancialEvent,
  RealizeFinancialEventResponse,
} from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getEventErrorMessage } from "@/features/events/lib/event-error-message";
import { isRecurringEvent } from "@/features/events/lib/event-presentation";
import { useRealizeFinancialEvent } from "@/features/events/mutations/use-financial-event-mutations";
import { paymentMethodLabel } from "@/features/transactions/lib/transaction-form";
import { formatCurrency, formatDateTime } from "@/lib/format";

type RealizeEventDialogProps = {
  event: FinancialEvent | null;
  accountsById: Map<string, Account>;
  creditCardsById: Map<string, CreditCardModel>;
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function RealizeEventDialog({
  event,
  accountsById,
  creditCardsById,
  open,
  onClose,
  onDone,
}: RealizeEventDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RealizeFinancialEventResponse | null>(null);
  const mutation = useRealizeFinancialEvent();

  // Reinicia o fluxo de dois passos quando o diálogo abre para outro evento.
  const session = open && event ? event.id : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setError(null);
      setResult(null);
    }
  }

  if (!event) {
    return null;
  }

  const eventToRealize = event;
  const isCardEvent = Boolean(eventToRealize.creditCardId);
  const account = eventToRealize.accountId ? accountsById.get(eventToRealize.accountId) : undefined;
  const creditCard = eventToRealize.creditCardId
    ? creditCardsById.get(eventToRealize.creditCardId)
    : undefined;
  const missingPaymentMethod = !isCardEvent && !eventToRealize.paymentMethod;

  function confirm() {
    setError(null);
    mutation.mutate(eventToRealize.id, {
      onSuccess: (response) => setResult(response),
      onError: (mutationError) => setError(getEventErrorMessage(mutationError, "realize")),
    });
  }

  function close() {
    if (result) {
      onDone("Evento realizado.");
      return;
    }
    onClose();
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description={
        result
          ? "Tudo certo — veja o que foi criado a partir do evento."
          : isCardEvent
            ? "A compra entra na fatura do cartão conforme o fechamento."
            : "Será criada uma transação na conta com o método de pagamento do evento."
      }
      descriptionId="realize-event-description"
      initialFocusSelector="#realize-event-confirm"
      onClose={close}
      open={open}
      title={result ? "Evento realizado" : "Realizar evento"}
      titleId="realize-event-title"
    >
      {result ? (
        <div className="evx-result-panel" data-testid="realize-result">
          <p className="evx-result-headline">
            <CheckCircle2 aria-hidden="true" color="var(--green-strong)" size={18} />
            <strong>{result.event.name}</strong> foi marcado como realizado.
          </p>
          <ul className="evx-result-list">
            {result.transaction ? (
              <li>
                <ReceiptText aria-hidden="true" size={15} />
                <span>
                  Transação criada: {result.transaction.description} ·{" "}
                  <strong>{formatCurrency(result.transaction.amount)}</strong>
                </span>
              </li>
            ) : null}
            {result.creditCardPurchase ? (
              <li>
                <CreditCard aria-hidden="true" size={15} />
                <span>
                  Compra no cartão criada: {result.creditCardPurchase.description} ·{" "}
                  <strong>{formatCurrency(result.creditCardPurchase.totalAmount)}</strong> em{" "}
                  {result.creditCardPurchase.installmentCount}x
                </span>
              </li>
            ) : null}
            {result.nextEvent ? (
              <li>
                <CalendarClock aria-hidden="true" size={15} />
                <span>
                  Próxima ocorrência criada para{" "}
                  <strong>{formatDateTime(result.nextEvent.date)}</strong> (Planejado).
                </span>
              </li>
            ) : null}
          </ul>
          <div className="account-form-actions">
            <button className="primary-button" onClick={close} type="button">
              Concluir
            </button>
          </div>
        </div>
      ) : (
        <div className="confirmation-dialog">
          <dl className="evx-realize-summary">
            <div>
              <dt>Evento</dt>
              <dd>{eventToRealize.name}</dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd>{formatCurrency(eventToRealize.expectedAmount)}</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>{formatDateTime(eventToRealize.date)}</dd>
            </div>
            {isCardEvent ? (
              <>
                <div>
                  <dt>Cartão</dt>
                  <dd>{creditCard?.name ?? "Cartão"}</dd>
                </div>
                <div>
                  <dt>Parcelas</dt>
                  <dd>{eventToRealize.installmentCount}x</dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt>Conta</dt>
                  <dd>{account?.name ?? "Conta"}</dd>
                </div>
                <div>
                  <dt>Método de pagamento</dt>
                  <dd>
                    {eventToRealize.paymentMethod
                      ? paymentMethodLabel(eventToRealize.paymentMethod)
                      : "Não definido"}
                  </dd>
                </div>
              </>
            )}
          </dl>

          {isRecurringEvent(eventToRealize.recurrence) ? (
            <p className="account-form-note">
              Evento recorrente: a próxima ocorrência será criada automaticamente ao realizar.
            </p>
          ) : null}

          {missingPaymentMethod ? (
            <p className="account-form-error" role="alert">
              Este evento não tem método de pagamento definido. Adie o evento para editá-lo e definir o
              método antes de realizar.
            </p>
          ) : null}

          {error ? (
            <p className="account-form-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="account-form-actions">
            <button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">
              Cancelar
            </button>
            <button
              className="primary-button"
              disabled={mutation.isPending || missingPaymentMethod}
              id="realize-event-confirm"
              onClick={confirm}
              type="button"
            >
              {mutation.isPending ? "Realizando…" : "Realizar evento"}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
