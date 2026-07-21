"use client";

import { useState } from "react";

import type { CreditCard, CreditCardInvoiceWithInstallments } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getCreditCardErrorMessage } from "@/features/wallet/credit-cards/lib/credit-card-error-message";
import { formatUtcDate } from "@/features/wallet/lib/wallet-presentation";
import { useArchiveCreditCard } from "@/features/wallet/credit-cards/mutations/use-archive-credit-card";
import { formatCurrency } from "@/lib/format";

type ArchiveCreditCardDialogProps = {
  card: CreditCard | null;
  currentInvoice: CreditCardInvoiceWithInstallments | null;
  onArchived: (card: CreditCard) => void;
  onClose: () => void;
  open: boolean;
};

export function ArchiveCreditCardDialog({
  card,
  currentInvoice,
  onArchived,
  onClose,
  open,
}: ArchiveCreditCardDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useArchiveCreditCard();

  if (!card) {
    return null;
  }

  const cardToArchive = card;

  async function handleConfirm() {
    setSubmitError(null);
    try {
      await mutation.mutateAsync(cardToArchive.id);
      onArchived(cardToArchive);
    } catch (error) {
      setSubmitError(getCreditCardErrorMessage(error, "archive"));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="O cartão deixará de aparecer como ativo."
      descriptionId="archive-credit-card-description"
      initialFocusSelector="#archive-credit-card-confirm"
      onClose={onClose}
      open={open}
      title="Arquivar cartão"
      titleId="archive-credit-card-title"
    >
      <div className="confirmation-dialog">
        <p>
          Arquivar <strong>{cardToArchive.name}</strong>? O histórico de compras, parcelas e faturas será
          preservado.
        </p>
        <p>
          {currentInvoice
            ? `Fatura atual: ${String(currentInvoice.month).padStart(2, "0")}/${currentInvoice.year} · ${formatCurrency(currentInvoice.totalAmount)} · vence ${formatUtcDate(currentInvoice.dueDate)}.`
            : "Nenhuma fatura foi retornada pela API para este cartão no mês UTC atual."}
        </p>
        {submitError ? (
          <p className="account-form-error" role="alert">
            {submitError}
          </p>
        ) : null}
        <div className="account-form-actions">
          <button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="danger-button"
            disabled={mutation.isPending}
            id="archive-credit-card-confirm"
            onClick={() => void handleConfirm()}
            type="button"
          >
            {mutation.isPending ? "Arquivando…" : "Arquivar cartão"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
