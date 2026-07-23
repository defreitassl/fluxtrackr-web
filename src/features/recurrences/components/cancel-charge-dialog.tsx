"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { getRecurrenceErrorMessage } from "@/features/recurrences/lib/recurrence-error-message";
import type { RecurrenceRailItem } from "@/features/recurrences/lib/recurrence-presentation";
import {
  useCancelFixedOccurrence,
  useCancelSubscriptionCharge,
} from "@/features/recurrences/mutations/use-recurrence-mutations";
import { formatCurrency } from "@/lib/format";

type CancelChargeDialogProps = {
  item: RecurrenceRailItem | null;
  onCanceled: (message: string) => void;
  onClose: () => void;
  open: boolean;
};

export function CancelChargeDialog({ item, onCanceled, onClose, open }: CancelChargeDialogProps) {
  const cancelCharge = useCancelSubscriptionCharge();
  const cancelOccurrence = useCancelFixedOccurrence();
  const [error, setError] = useState<string | null>(null);
  const session = open && item ? `${item.source}:${item.id}` : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) setError(null);
  }

  if (!item) return null;
  const recurrence = item;
  const isBusy = cancelCharge.isPending || cancelOccurrence.isPending;

  async function handleCancel() {
    setError(null);
    try {
      if (recurrence.source === "subscription") await cancelCharge.mutateAsync(recurrence.id);
      else await cancelOccurrence.mutateAsync(recurrence.id);
      onCanceled("Pendência cancelada.");
    } catch (mutationError) {
      setError(getRecurrenceErrorMessage(mutationError, "cancel"));
    }
  }

  return (
    <Dialog busy={isBusy} description="O cancelamento preserva o histórico e não cria movimentação." descriptionId="cancel-charge-description" initialFocusSelector="#cancel-charge-confirm" onClose={onClose} open={open} title="Cancelar pendência" titleId="cancel-charge-title">
      <div className="confirmation-dialog">
        <p>Cancelar <strong>{item.name}</strong> de {formatCurrency(item.amount)}?</p>
        {error ? <p className="account-form-error" role="alert">{error}</p> : null}
        <div className="account-form-actions"><button className="secondary-button" disabled={isBusy} onClick={onClose} type="button">Voltar</button><button className="danger-button" disabled={isBusy} id="cancel-charge-confirm" onClick={() => void handleCancel()} type="button">{isBusy ? "Cancelando…" : "Cancelar pendência"}</button></div>
      </div>
    </Dialog>
  );
}
