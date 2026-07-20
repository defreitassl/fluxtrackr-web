import { CreditCard } from "lucide-react";
import type { CSSProperties } from "react";

import type { CreditCard as CreditCardModel } from "@/api/generated/client";
import { isSafeHexColor } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type CreditCardItemProps = {
  card: CreditCardModel;
  invoiceCount: number;
  isSelected: boolean;
  onSelect: () => void;
};

export function CreditCardItem({ card, invoiceCount, isSelected, onSelect }: CreditCardItemProps) {
  const accent = isSafeHexColor(card.color) ? card.color : undefined;
  const style = accent ? ({ "--wallet-accent": accent } as CSSProperties) : undefined;

  return (
    <button
      aria-pressed={isSelected}
      className={`wallet-credit-card${isSelected ? " is-selected" : ""}`}
      onClick={onSelect}
      style={style}
      type="button"
    >
      <span className="wallet-card-topline">
        <span>
          <CreditCard aria-hidden="true" size={18} /> {card.name}
        </span>
        {card.lastFourDigits ? <strong>•••• {card.lastFourDigits}</strong> : null}
      </span>
      <span className="wallet-card-bank">
        {[card.bankName, card.brand].filter(Boolean).join(" · ") || "Cartão de crédito"}
      </span>
      <span className="wallet-card-limit">
        Limite configurado: <strong>{formatCurrency(card.limitAmount)}</strong>
      </span>
      <span className="wallet-card-meta">
        {card.closingDay ? `Fecha dia ${card.closingDay}` : "Sem dia de fechamento"} · Vence dia{" "}
        {card.dueDay}
      </span>
      <span className="wallet-card-no-invoice">{invoiceSummary(invoiceCount)}</span>
    </button>
  );
}

function invoiceSummary(invoiceCount: number) {
  if (invoiceCount === 0) {
    return "Sem fatura no mês UTC atual.";
  }
  if (invoiceCount === 1) {
    return "1 fatura no mês — ver detalhes.";
  }
  return `${invoiceCount} faturas no mês — ver detalhes.`;
}
