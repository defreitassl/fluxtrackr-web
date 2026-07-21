"use client";

import { ArrowRightLeft, CreditCard, TrendingDown, TrendingUp } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";

export type NewMovementKind = "expense" | "income" | "transfer" | "credit-card-purchase";

type NewMovementDialogProps = {
  canTransfer: boolean;
  onClose: () => void;
  onSelect: (kind: NewMovementKind) => void;
  open: boolean;
};

const choices: Array<{
  kind: NewMovementKind;
  label: string;
  description: string;
  Icon: typeof TrendingDown;
}> = [
  { kind: "expense", label: "Despesa", description: "Registre uma saída já realizada.", Icon: TrendingDown },
  { kind: "income", label: "Receita", description: "Registre uma entrada já realizada.", Icon: TrendingUp },
  { kind: "transfer", label: "Transferência", description: "Mova valor entre duas contas sem criar receita ou despesa.", Icon: ArrowRightLeft },
  { kind: "credit-card-purchase", label: "Compra no cartão", description: "Registre uma compra e deixe a API criar parcelas e fatura.", Icon: CreditCard },
];

export function NewMovementDialog({ canTransfer, onClose, onSelect, open }: NewMovementDialogProps) {
  return (
    <Dialog
      description="Escolha o tipo de movimentação que deseja registrar."
      descriptionId="new-movement-description"
      initialFocusSelector="#new-movement-expense"
      onClose={onClose}
      open={open}
      title="Nova movimentação"
      titleId="new-movement-title"
    >
      <div className="new-movement-options">
        {choices.map(({ kind, label, description, Icon }) => {
          const disabled = kind === "transfer" && !canTransfer;
          return (
            <button
              aria-describedby={disabled ? "new-movement-transfer-note" : undefined}
              className="new-movement-option"
              disabled={disabled}
              id={`new-movement-${kind === "credit-card-purchase" ? "card" : kind}`}
              key={kind}
              onClick={() => onSelect(kind)}
              type="button"
            >
              <span className="new-movement-option-icon"><Icon aria-hidden="true" size={18} /></span>
              <span><strong>{label}</strong><small>{description}</small></span>
            </button>
          );
        })}
      </div>
      {!canTransfer ? <p className="account-form-note" id="new-movement-transfer-note">Crie pelo menos duas contas ativas para fazer uma transferência.</p> : null}
    </Dialog>
  );
}
