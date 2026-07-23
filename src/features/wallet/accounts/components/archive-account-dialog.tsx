"use client";

import { useState } from "react";

import type { Account } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getAccountErrorMessage } from "@/features/wallet/accounts/lib/account-error-message";
import { useArchiveAccount } from "@/features/wallet/accounts/mutations/use-archive-account";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { formatCurrency } from "@/lib/format";

type ArchiveAccountDialogProps = {
  account: WalletAccount | null;
  onArchived: (account: Account) => void;
  onClose: () => void;
  open: boolean;
};

export function ArchiveAccountDialog({ account, onArchived, onClose, open }: ArchiveAccountDialogProps) {
  const mutation = useArchiveAccount();
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!account) return null;
  const accountToArchive = account;

  async function handleConfirm() {
    setSubmitError(null);
    try {
      await mutation.mutateAsync(accountToArchive.account.id);
      onArchived(accountToArchive.account);
    } catch (error) {
      setSubmitError(getAccountErrorMessage(error, "archive"));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="A conta deixará de aceitar novas operações."
      descriptionId="archive-account-description"
      initialFocusSelector="#archive-account-confirm"
      onClose={onClose}
      open={open}
      title="Arquivar conta"
      titleId="archive-account-title"
    >
      <div className="confirmation-dialog">
        <p>
          Arquivar <strong>{accountToArchive.account.name}</strong>? O saldo atual de {" "}
          <strong>{formatCurrency(accountToArchive.balance.currentBalance)}</strong> e todo o histórico de
          transferências, ajustes e movimentações serão preservados.
        </p>
        <p>Arquivar não apaga dados nem altera lançamentos já realizados.</p>
        {submitError ? <p className="account-form-error" role="alert">{submitError}</p> : null}
        <div className="account-form-actions">
          <button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="danger-button"
            disabled={mutation.isPending}
            id="archive-account-confirm"
            onClick={() => void handleConfirm()}
            type="button"
          >
            {mutation.isPending ? "Arquivando…" : "Arquivar conta"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
