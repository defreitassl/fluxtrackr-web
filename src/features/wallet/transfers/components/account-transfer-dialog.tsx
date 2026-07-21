"use client";

import { useState } from "react";

import type { AccountTransfer } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { AccountTransferForm } from "@/features/wallet/transfers/components/account-transfer-form";
import { getAccountTransferErrorMessage } from "@/features/wallet/transfers/lib/account-transfer-error-message";
import { toCreateAccountTransferPayload } from "@/features/wallet/transfers/lib/account-transfer-form-mapper";
import { useCreateAccountTransfer } from "@/features/wallet/transfers/mutations/use-create-account-transfer";
import type { AccountTransferFormValues } from "@/features/wallet/transfers/schemas/account-transfer-form-schema";

type AccountTransferDialogProps = {
  accounts: WalletAccount[];
  initialSourceAccountId: string | null;
  onClose: () => void;
  onTransferred: (transfer: AccountTransfer) => void;
  open: boolean;
};

export function AccountTransferDialog({
  accounts,
  initialSourceAccountId,
  onClose,
  onTransferred,
  open,
}: AccountTransferDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCreateAccountTransfer();

  if (!initialSourceAccountId || !accounts.some(({ account }) => account.id === initialSourceAccountId)) {
    return null;
  }

  async function handleSubmit(values: AccountTransferFormValues) {
    setSubmitError(null);
    try {
      const transfer = await mutation.mutateAsync(toCreateAccountTransferPayload(values));
      onTransferred(transfer);
    } catch (error) {
      setSubmitError(getAccountTransferErrorMessage(error));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="Mova um valor entre suas contas. A transferência apenas redistribui o saldo e não será registrada como receita ou despesa."
      descriptionId="account-transfer-description"
      initialFocusSelector="#account-transfer-amount"
      onClose={onClose}
      open={open}
      title="Transferir entre contas"
      titleId="account-transfer-title"
    >
      <AccountTransferForm
        accounts={accounts}
        initialSourceAccountId={initialSourceAccountId}
        isSubmitting={mutation.isPending}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </Dialog>
  );
}
