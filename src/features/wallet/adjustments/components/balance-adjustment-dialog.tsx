"use client";

import { useState } from "react";

import type { Account, CreateBalanceAdjustmentResponse } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { BalanceAdjustmentForm } from "@/features/wallet/adjustments/components/balance-adjustment-form";
import { getBalanceAdjustmentErrorMessage } from "@/features/wallet/adjustments/lib/balance-adjustment-error-message";
import { toCreateBalanceAdjustmentPayload } from "@/features/wallet/adjustments/lib/balance-adjustment-form-mapper";
import { useCreateBalanceAdjustment } from "@/features/wallet/adjustments/mutations/use-create-balance-adjustment";
import type { BalanceAdjustmentFormValues } from "@/features/wallet/adjustments/schemas/balance-adjustment-form-schema";

type BalanceAdjustmentDialogProps = {
  account: Account | null;
  currentBalance: string | null;
  onAdjusted: (response: CreateBalanceAdjustmentResponse) => void;
  onClose: () => void;
  open: boolean;
};

export function BalanceAdjustmentDialog({
  account,
  currentBalance,
  onAdjusted,
  onClose,
  open,
}: BalanceAdjustmentDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCreateBalanceAdjustment();

  if (!account || !currentBalance) {
    return null;
  }
  const selectedAccount = account;
  const selectedCurrentBalance = currentBalance;

  async function handleSubmit(values: BalanceAdjustmentFormValues) {
    setSubmitError(null);
    try {
      const response = await mutation.mutateAsync({
        accountId: selectedAccount.id,
        payload: toCreateBalanceAdjustmentPayload(values),
      });
      onAdjusted(response);
    } catch (error) {
      setSubmitError(getBalanceAdjustmentErrorMessage(error));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="Informe o saldo real da conta. A API registrará o saldo anterior, o novo saldo e a diferença como um ajuste permanente no histórico."
      descriptionId="balance-adjustment-description"
      initialFocusSelector="#balance-adjustment-new-balance"
      onClose={onClose}
      open={open}
      title="Ajustar saldo"
      titleId="balance-adjustment-title"
    >
      <BalanceAdjustmentForm
        accountName={selectedAccount.name}
        currentBalance={selectedCurrentBalance}
        isSubmitting={mutation.isPending}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </Dialog>
  );
}
