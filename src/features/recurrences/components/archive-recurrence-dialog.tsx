"use client";

import { useState } from "react";

import type { FixedExpense, FixedIncome, Subscription } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getRecurrenceErrorMessage } from "@/features/recurrences/lib/recurrence-error-message";
import {
  useArchiveFixedExpense,
  useArchiveFixedIncome,
  useArchiveSubscription,
} from "@/features/recurrences/mutations/use-recurrence-mutations";

export type ArchiveRecurrenceTarget =
  | { kind: "subscription"; item: Subscription }
  | { kind: "fixed-expense"; item: FixedExpense }
  | { kind: "fixed-income"; item: FixedIncome };

type ArchiveRecurrenceDialogProps = {
  onArchived: (message: string) => void;
  onClose: () => void;
  open: boolean;
  target: ArchiveRecurrenceTarget | null;
};

export function ArchiveRecurrenceDialog({ onArchived, onClose, open, target }: ArchiveRecurrenceDialogProps) {
  const archiveSubscription = useArchiveSubscription();
  const archiveExpense = useArchiveFixedExpense();
  const archiveIncome = useArchiveFixedIncome();
  const [error, setError] = useState<string | null>(null);
  const session = open && target ? `${target.kind}:${target.item.id}` : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) setError(null);
  }

  if (!target) return null;
  const recurrence = target;
  const isBusy = archiveSubscription.isPending || archiveExpense.isPending || archiveIncome.isPending;
  const label = recurrence.kind === "subscription" ? "assinatura" : recurrence.kind === "fixed-expense" ? "gasto fixo" : "renda fixa";

  async function handleArchive() {
    setError(null);
    try {
      if (recurrence.kind === "subscription") await archiveSubscription.mutateAsync(recurrence.item.id);
      else if (recurrence.kind === "fixed-expense") await archiveExpense.mutateAsync(recurrence.item.id);
      else await archiveIncome.mutateAsync(recurrence.item.id);
      onArchived(`${label[0].toUpperCase()}${label.slice(1)} arquivado(a).`);
    } catch (mutationError) {
      setError(getRecurrenceErrorMessage(mutationError, "archive"));
    }
  }

  return (
    <Dialog busy={isBusy} description="O histórico é preservado; novas pendências não serão criadas." descriptionId="archive-recurrence-description" initialFocusSelector="#archive-recurrence-confirm" onClose={onClose} open={open} title={`Arquivar ${label}`} titleId="archive-recurrence-title">
      <div className="confirmation-dialog">
        <p>Arquivar <strong>{target.item.name}</strong>? Esta ação mantém os registros realizados e cancelados no histórico.</p>
        {error ? <p className="account-form-error" role="alert">{error}</p> : null}
        <div className="account-form-actions"><button className="secondary-button" disabled={isBusy} onClick={onClose} type="button">Voltar</button><button className="danger-button" disabled={isBusy} id="archive-recurrence-confirm" onClick={() => void handleArchive()} type="button">{isBusy ? "Arquivando…" : `Arquivar ${label}`}</button></div>
      </div>
    </Dialog>
  );
}
