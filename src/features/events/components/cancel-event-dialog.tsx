"use client";

import { useState } from "react";

import type { FinancialEvent } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getEventErrorMessage } from "@/features/events/lib/event-error-message";
import { useCancelFinancialEvent } from "@/features/events/mutations/use-financial-event-mutations";
import { formatCurrency, formatDateTime } from "@/lib/format";

type CancelEventDialogProps = {
  event: FinancialEvent | null;
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function CancelEventDialog({ event, open, onClose, onDone }: CancelEventDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useCancelFinancialEvent();

  if (!event) {
    return null;
  }

  const eventToCancel = event;

  async function confirm() {
    setError(null);
    try {
      await mutation.mutateAsync(eventToCancel.id);
      onDone("Evento cancelado.");
    } catch (mutationError) {
      setError(getEventErrorMessage(mutationError, "cancel"));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="O evento sai das projeções de saldo, mas continua no histórico como Cancelado."
      descriptionId="cancel-event-description"
      initialFocusSelector="#cancel-event-confirm"
      onClose={onClose}
      open={open}
      title="Cancelar evento"
      titleId="cancel-event-title"
    >
      <div className="confirmation-dialog">
        <p>
          Cancelar <strong>{eventToCancel.name}</strong> de{" "}
          <strong>{formatCurrency(eventToCancel.expectedAmount)}</strong> previsto para{" "}
          {formatDateTime(eventToCancel.date)}?
        </p>

        {error ? (
          <p className="account-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="account-form-actions">
          <button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">
            Voltar
          </button>
          <button
            className="danger-button"
            disabled={mutation.isPending}
            id="cancel-event-confirm"
            onClick={() => void confirm()}
            type="button"
          >
            {mutation.isPending ? "Cancelando…" : "Cancelar evento"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
