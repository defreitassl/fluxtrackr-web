"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import type { CreditCard, CreditCardInvoiceWithInstallments } from "@/api/generated/client";
import { getInvoiceStatusLabel, isSafeHexColor } from "@/features/wallet/lib/wallet-presentation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const dueFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const compactCurrency = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function cardMonogram(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type WalletCardRowsProps = {
  creditCards: CreditCard[];
  invoices: CreditCardInvoiceWithInstallments[];
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onCreateCard: () => void;
};

export function WalletCardRows({
  creditCards,
  invoices,
  selectedCardId,
  onSelectCard,
  onCreateCard,
}: WalletCardRowsProps) {
  const [now] = useState(() => Date.now());

  return (
    <div className="wlx-cards">
      {creditCards.map((card) => {
        const invoice = invoices.find((entry) => entry.creditCardId === card.id);
        const total = invoice ? Number(invoice.totalAmount) : 0;
        const limit = Number(card.limitAmount);
        const usage = limit > 0 ? Math.min(100, (total / limit) * 100) : 0;
        const dueInDays = invoice
          ? Math.ceil((new Date(invoice.dueDate).getTime() - now) / DAY_IN_MS)
          : null;
        return (
          <button
            aria-pressed={card.id === selectedCardId}
            className="wlx-card-row"
            key={card.id}
            onClick={() => onSelectCard(card.id)}
            type="button"
          >
            <span
              className="wlx-card-logo"
              style={isSafeHexColor(card.color) ? { background: card.color ?? undefined } : undefined}
            >
              {cardMonogram(card.name)}
            </span>
            <div>
              <strong>{card.name}</strong>
              <span className="wlx-card-digits">
                {card.lastFourDigits ? `•••• ${card.lastFourDigits}` : (card.brand ?? card.bankName ?? "—")}
              </span>
            </div>
            <div className="wlx-card-invoice">
              {invoice ? (
                <>
                  <span>Fatura atual · {getInvoiceStatusLabel(invoice.status).toLowerCase()}</span>
                  <strong>{formatCurrency(invoice.totalAmount)}</strong>
                </>
              ) : (
                <>
                  <span>Fatura atual</span>
                  <strong style={{ color: "var(--text-muted)" }}>—</strong>
                </>
              )}
            </div>
            <div className="wlx-card-usage">
              {invoice ? (
                <span className={cn("wlx-due-pill", dueInDays !== null && dueInDays <= 7 && "wlx-due-pill-near")}>
                  vence {dueFormatter.format(new Date(invoice.dueDate))}
                </span>
              ) : (
                <span className="wlx-due-pill">sem fatura</span>
              )}
              <div className="wlx-usage-bar" aria-hidden="true">
                <i style={{ width: `${usage}%` }} />
              </div>
              <span className="wlx-usage-label">
                R$ {compactCurrency.format(total)} / {compactCurrency.format(limit)}
              </span>
            </div>
          </button>
        );
      })}
      <button className="wlx-add-row" onClick={onCreateCard} type="button">
        <Plus aria-hidden="true" size={15} />
        <span>Novo cartão</span>
      </button>
    </div>
  );
}
