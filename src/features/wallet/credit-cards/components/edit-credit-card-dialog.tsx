"use client";

import { useState } from "react";

import type { CreditCard } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { CreditCardForm } from "@/features/wallet/credit-cards/components/credit-card-form";
import { getCreditCardErrorMessage } from "@/features/wallet/credit-cards/lib/credit-card-error-message";
import {
  toCreditCardFormValues,
  toUpdateCreditCardPayload,
} from "@/features/wallet/credit-cards/lib/credit-card-form-mappers";
import { useUpdateCreditCard } from "@/features/wallet/credit-cards/mutations/use-update-credit-card";
import type { CreditCardFormValues } from "@/features/wallet/credit-cards/schemas/credit-card-form-schema";

type EditCreditCardDialogProps = {
  accounts: WalletAccount[];
  card: CreditCard | null;
  onClose: () => void;
  onUpdated: (card: CreditCard) => void;
  open: boolean;
};

export function EditCreditCardDialog({
  accounts,
  card,
  onClose,
  onUpdated,
  open,
}: EditCreditCardDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useUpdateCreditCard();

  if (!card) {
    return null;
  }

  const cardToEdit = card;

  async function handleSubmit(values: CreditCardFormValues) {
    setSubmitError(null);
    try {
      const updated = await mutation.mutateAsync({
        id: cardToEdit.id,
        payload: toUpdateCreditCardPayload(values),
      });
      onUpdated(updated);
    } catch (error) {
      setSubmitError(getCreditCardErrorMessage(error, "update"));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="Atualize apenas os dados de cadastro. O histórico financeiro continuará sendo fornecido pela API."
      descriptionId="edit-credit-card-description"
      initialFocusSelector="#edit-credit-card-name"
      onClose={onClose}
      open={open}
      title="Editar cartão"
      titleId="edit-credit-card-title"
    >
      <CreditCardForm
        accounts={accounts}
        defaultValues={toCreditCardFormValues(cardToEdit)}
        formId="edit-credit-card-form"
        idPrefix="edit-credit-card"
        isSubmitting={mutation.isPending}
        key={cardToEdit.id}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </Dialog>
  );
}
