"use client";

import { useState } from "react";

import type { CreditCard } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { CreditCardForm } from "@/features/wallet/credit-cards/components/credit-card-form";
import { getCreditCardErrorMessage } from "@/features/wallet/credit-cards/lib/credit-card-error-message";
import {
  defaultCreditCardFormValues,
  toCreateCreditCardPayload,
} from "@/features/wallet/credit-cards/lib/credit-card-form-mappers";
import { useCreateCreditCard } from "@/features/wallet/credit-cards/mutations/use-create-credit-card";
import type { CreditCardFormValues } from "@/features/wallet/credit-cards/schemas/credit-card-form-schema";

type CreateCreditCardDialogProps = {
  accounts: WalletAccount[];
  onClose: () => void;
  onCreated: (card: CreditCard) => void;
  open: boolean;
};

export function CreateCreditCardDialog({ accounts, onClose, onCreated, open }: CreateCreditCardDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCreateCreditCard();

  async function handleSubmit(values: CreditCardFormValues) {
    setSubmitError(null);
    try {
      const card = await mutation.mutateAsync(toCreateCreditCardPayload(values));
      onCreated(card);
    } catch (error) {
      setSubmitError(getCreditCardErrorMessage(error, "create"));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="Cadastre os dados do cartão. Compras, parcelas e faturas serão sempre calculadas pela API."
      descriptionId="create-credit-card-description"
      initialFocusSelector="#create-credit-card-name"
      onClose={onClose}
      open={open}
      title="Novo cartão"
      titleId="create-credit-card-title"
    >
      <CreditCardForm
        accounts={accounts}
        defaultValues={defaultCreditCardFormValues()}
        formId="create-credit-card-form"
        idPrefix="create-credit-card"
        isSubmitting={mutation.isPending}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </Dialog>
  );
}
