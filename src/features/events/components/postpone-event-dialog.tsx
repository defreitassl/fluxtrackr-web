"use client";

import { useState } from "react";

import type { FinancialEvent } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getEventErrorMessage } from "@/features/events/lib/event-error-message";
import { usePostponeFinancialEvent } from "@/features/events/mutations/use-financial-event-mutations";
import { isoToDateTimeLocal } from "@/features/transactions/lib/transaction-form";
import { formatDateTime } from "@/lib/format";

type PostponeEventDialogProps = {
  event: FinancialEvent | null;
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function PostponeEventDialog({ event, open, onClose, onDone }: PostponeEventDialogProps) {
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = usePostponeFinancialEvent();

  // Reinicia o formulário quando o diálogo abre (ajuste de estado no render).
  const session = open && event ? event.id : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null && event) {
      setError(null);
      setDate(isoToDateTimeLocal(event.date));
    }
  }

  if (!event) {
    return null;
  }

  const eventToPostpone = event;

  function confirm() {
    setError(null);
    if (!date || Number.isNaN(new Date(date).getTime())) {
      setError("Informe a nova data e hora do evento.");
      return;
    }

    mutation.mutate(
      { id: eventToPostpone.id, payload: { date: new Date(date).toISOString() } },
      {
        onSuccess: () => onDone("Evento adiado."),
        onError: (mutationError) => setError(getEventErrorMessage(mutationError, "postpone")),
      },
    );
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="O evento passa para o status Adiado e as projeções usam a nova data."
      descriptionId="postpone-event-description"
      initialFocusSelector="#postpone-event-date"
      onClose={onClose}
      open={open}
      title="Adiar evento"
      titleId="postpone-event-title"
    >
      <div className="account-form">
        <p className="account-form-note">
          <strong>{eventToPostpone.name}</strong> está previsto para {formatDateTime(eventToPostpone.date)}.
        </p>
        <label className="account-field">
          Nova data
          <input
            id="postpone-event-date"
            onChange={(changeEvent) => setDate(changeEvent.target.value)}
            type="datetime-local"
            value={date}
          />
        </label>

        {error ? (
          <p className="account-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="account-form-actions">
          <button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="primary-button" disabled={mutation.isPending} onClick={confirm} type="button">
            {mutation.isPending ? "Adiando…" : "Adiar evento"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
