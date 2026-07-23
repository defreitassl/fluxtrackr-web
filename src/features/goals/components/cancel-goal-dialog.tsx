"use client";

import { useState } from "react";

import type { FinancialGoal } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getGoalErrorMessage } from "@/features/goals/lib/goal-error-message";
import { useCancelFinancialGoal } from "@/features/goals/mutations/use-goal-mutations";
import { formatCurrency } from "@/lib/format";

type CancelGoalDialogProps = {
  goal: FinancialGoal | null;
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function CancelGoalDialog({ goal, open, onClose, onDone }: CancelGoalDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useCancelFinancialGoal();

  if (!goal) {
    return null;
  }

  const goalToCancel = goal;

  async function confirm() {
    setError(null);
    try {
      await mutation.mutateAsync(goalToCancel.id);
      onDone("Meta cancelada.");
    } catch (mutationError) {
      setError(getGoalErrorMessage(mutationError, "cancel"));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="O progresso e o histórico de aportes são preservados. Você pode reativar a meta depois."
      descriptionId="cancel-goal-description"
      initialFocusSelector="#cancel-goal-confirm"
      onClose={onClose}
      open={open}
      title="Cancelar meta"
      titleId="cancel-goal-title"
    >
      <div className="confirmation-dialog">
        <p>
          Cancelar <strong>{goalToCancel.name}</strong>? Você já guardou{" "}
          <strong>{formatCurrency(goalToCancel.currentAmount)}</strong> de{" "}
          {formatCurrency(goalToCancel.targetAmount)}.
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
            id="cancel-goal-confirm"
            onClick={() => void confirm()}
            type="button"
          >
            {mutation.isPending ? "Cancelando…" : "Cancelar meta"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
