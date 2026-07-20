"use client";

import { useState } from "react";

import type { Account } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { AccountForm } from "@/features/wallet/accounts/components/account-form";
import { getAccountErrorMessage } from "@/features/wallet/accounts/lib/account-error-message";
import {
  toEditAccountFormValues,
  toUpdateAccountPayload,
} from "@/features/wallet/accounts/lib/account-form-mappers";
import { useUpdateAccount } from "@/features/wallet/accounts/mutations/use-update-account";
import type { EditAccountFormValues } from "@/features/wallet/accounts/schemas/account-form-schema";

type EditAccountDialogProps = {
  account: Account | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (account: Account) => void;
};

export function EditAccountDialog({ account, open, onClose, onUpdated }: EditAccountDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useUpdateAccount();

  if (!account) {
    return null;
  }

  async function handleSubmit(values: EditAccountFormValues) {
    setSubmitError(null);
    try {
      const updated = await mutation.mutateAsync({
        id: account!.id,
        payload: toUpdateAccountPayload(values),
      });
      onUpdated(updated);
    } catch (error) {
      setSubmitError(getAccountErrorMessage(error));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="Atualize apenas os metadados da conta. O saldo inicial permanece inalterado."
      descriptionId="edit-account-description"
      initialFocusSelector="#edit-account-name"
      onClose={onClose}
      open={open}
      title="Editar conta"
      titleId="edit-account-title"
    >
      <AccountForm
        defaultValues={toEditAccountFormValues(account)}
        formId="edit-account-form"
        idPrefix="edit-account"
        isSubmitting={mutation.isPending}
        key={account.id}
        mode="edit"
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </Dialog>
  );
}
