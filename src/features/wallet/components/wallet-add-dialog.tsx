"use client";

import { CreditCard, Landmark } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";

type WalletAddDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  onCreateCard: () => void;
};

export function WalletAddDialog({ open, onClose, onCreateAccount, onCreateCard }: WalletAddDialogProps) {
  return (
    <Dialog
      description="Escolha o que você quer adicionar."
      descriptionId="wallet-add-description"
      onClose={onClose}
      open={open}
      title="Adicionar à carteira"
      titleId="wallet-add-title"
    >
      <div className="wlx-account-options">
        <button className="wlx-account-option" onClick={onCreateAccount} type="button">
          <span className="wlx-avatar">
            <Landmark aria-hidden="true" size={16} />
          </span>
          <span className="wlx-account-option-info">
            <strong>Conta</strong>
            <span style={{ fontFamily: "inherit" }}>Conta corrente, poupança, dinheiro…</span>
          </span>
        </button>
        <button className="wlx-account-option" onClick={onCreateCard} type="button">
          <span className="wlx-avatar">
            <CreditCard aria-hidden="true" size={16} />
          </span>
          <span className="wlx-account-option-info">
            <strong>Cartão de crédito</strong>
            <span style={{ fontFamily: "inherit" }}>Com limite, fechamento e vencimento</span>
          </span>
        </button>
      </div>
    </Dialog>
  );
}
