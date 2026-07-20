"use client";

import { useState } from "react";

import type { Account } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { AccountForm } from "@/features/wallet/accounts/components/account-form";
import { getAccountErrorMessage } from "@/features/wallet/accounts/lib/account-error-message";
import {
  defaultCreateAccountFormValues,
  toCreateAccountPayload,
} from "@/features/wallet/accounts/lib/account-form-mappers";
import { useCreateAccount } from "@/features/wallet/accounts/mutations/use-create-account";
import type { CreateAccountFormValues } from "@/features/wallet/accounts/schemas/account-form-schema";

type CreateAccountDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (account: Account) => void;
};

export function CreateAccountDialog({ open, onClose, onCreated }: CreateAccountDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCreateAccount();

  async function handleSubmit(values: CreateAccountFormValues) {
    setSubmitError(null);
    try {
      const account = await mutation.mutateAsync(toCreateAccountPayload(values));
      onCreated(account);
    } catch (error) {
      setSubmitError(getAccountErrorMessage(error));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="Defina os dados iniciais. O saldo inicial só pode ser informado na criação."
      descriptionId="create-account-description"
      initialFocusSelector="#create-account-name"
      onClose={onClose}
      open={open}
      title="Nova conta"
      titleId="create-account-title"
    >
      <AccountForm
        defaultValues={defaultCreateAccountFormValues()}
        formId="create-account-form"
        idPrefix="create-account"
        isSubmitting={mutation.isPending}
        mode="create"
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </Dialog>
  );
}
