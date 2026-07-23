"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, Info, Pencil, ReceiptText, ShoppingBag } from "lucide-react";
import { useMemo } from "react";

import type {
  Category,
  CreditCard,
  CreditCardInvoiceWithInstallments,
} from "@/api/generated/client";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import { listTransactionCategoriesData } from "@/features/transactions/api/transactions";
import { WalletPurchasesSection } from "@/features/wallet/components/wallet-purchases-section";
import { getInvoiceStatusLabel, isSafeHexColor } from "@/features/wallet/lib/wallet-presentation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/lib/http";

const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const payableStatuses = new Set(["open", "closed", "overdue"]);

function cardMonogram(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function statusPillClass(status: string) {
  if (status === "paid") return "wlx-status-paid";
  if (status === "overdue") return "wlx-status-overdue";
  if (status === "open" || status === "closed") return "wlx-status-open";
  return "";
}

function bestPurchaseDay(invoice: CreditCardInvoiceWithInstallments, card: CreditCard | null) {
  if (invoice.closingDate) {
    const closing = new Date(invoice.closingDate);
    return dayMonthFormatter.format(new Date(closing.getTime() + 24 * 60 * 60 * 1000));
  }
  if (card?.closingDay) {
    const nextDay = (card.closingDay % 28) + 1;
    return `dia ${nextDay}`;
  }
  return "—";
}

type WalletInvoicePanelProps = {
  card: CreditCard | null;
  cardInvoices: CreditCardInvoiceWithInstallments[];
  invoice: CreditCardInvoiceWithInstallments | null;
  onSelectInvoice: (id: string) => void;
  onPay: (invoice: CreditCardInvoiceWithInstallments) => void;
  onCreatePurchase: () => void;
  onEditCard: (card: CreditCard) => void;
  onArchiveCard: (card: CreditCard, invoice: CreditCardInvoiceWithInstallments | undefined) => void;
};

export function WalletInvoicePanel({
  card,
  cardInvoices,
  invoice,
  onSelectInvoice,
  onPay,
  onCreatePurchase,
  onEditCard,
  onArchiveCard,
}: WalletInvoicePanelProps) {
  const categories = useQuery<Category[], ApiError>({
    queryKey: ["transaction-categories"],
    queryFn: listTransactionCategoriesData,
    retry: false,
  });
  const categoriesById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  );

  if (!card) {
    return (
      <aside className="wlx-invoice-panel" aria-label="Fatura do cartão">
        <div className="wlx-invoice-empty">
          <div>
            <p>Nenhum cartão selecionado.</p>
            <p>Cadastre ou escolha um cartão para ver a fatura.</p>
          </div>
        </div>
      </aside>
    );
  }

  const monthLabel = invoice
    ? monthYearFormatter.format(new Date(Date.UTC(invoice.year, invoice.month - 1, 1)))
    : null;
  const canPay = invoice ? payableStatuses.has(invoice.status) : false;

  return (
    <aside className="wlx-invoice-panel" aria-label={`Fatura ${card.name}`}>
      <div className="wlx-invoice-head">
        <div className="wlx-invoice-title-row">
          <div className="wlx-invoice-title">
            <span
              className="wlx-invoice-logo"
              style={isSafeHexColor(card.color) ? { background: card.color ?? undefined } : undefined}
            >
              {cardMonogram(card.name)}
            </span>
            <div>
              <strong>Fatura {card.name}</strong>
              <span>
                {monthLabel ? monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) : "Sem fatura no mês"}
                {card.lastFourDigits ? ` · •••• ${card.lastFourDigits}` : ""}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {invoice ? (
              <span className={cn("wlx-status-pill", statusPillClass(invoice.status))}>
                {getInvoiceStatusLabel(invoice.status)}
              </span>
            ) : null}
            <button
              aria-label={`Editar ${card.name}`}
              className="wlx-menu-button"
              onClick={() => onEditCard(card)}
              title="Editar cartão"
              type="button"
            >
              <Pencil aria-hidden="true" size={14} />
            </button>
            <button
              aria-label={`Arquivar ${card.name}`}
              className="wlx-menu-button"
              onClick={() => onArchiveCard(card, invoice ?? undefined)}
              title="Arquivar cartão"
              type="button"
            >
              <Archive aria-hidden="true" size={14} />
            </button>
          </div>
        </div>

        <div className="wlx-invoice-total">
          <span>Total da fatura</span>
          <strong>{invoice ? formatCurrency(invoice.totalAmount) : "—"}</strong>
        </div>

        {invoice ? (
          <div className="wlx-invoice-dates">
            <div>
              <span>Fechamento</span>
              <strong>
                {invoice.closingDate ? dayMonthFormatter.format(new Date(invoice.closingDate)) : "—"}
              </strong>
            </div>
            <div className="wlx-due">
              <span>Vencimento</span>
              <strong>{dayMonthFormatter.format(new Date(invoice.dueDate))}</strong>
            </div>
            <div>
              <span>Melhor dia</span>
              <strong>{bestPurchaseDay(invoice, card)}</strong>
            </div>
          </div>
        ) : null}

        {cardInvoices.length > 1 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {cardInvoices.map((entry) => (
              <button
                aria-pressed={entry.id === invoice?.id}
                className={cn("txx-chip", entry.id === invoice?.id && "txx-chip-active")}
                key={entry.id}
                onClick={() => onSelectInvoice(entry.id)}
                style={{ height: 28 }}
                type="button"
              >
                {String(entry.month).padStart(2, "0")}/{entry.year} · {formatCurrency(entry.totalAmount)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="wlx-invoice-body">
        <div className="wlx-invoice-items-head">
          <span>Lançamentos da fatura</span>
          <span>
            {invoice?.installments.length ?? 0} {invoice?.installments.length === 1 ? "item" : "itens"}
          </span>
        </div>
        {!invoice || invoice.installments.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 11, padding: "14px 0" }}>
            Nenhum lançamento nesta fatura. Registre uma compra no cartão.
          </p>
        ) : (
          invoice.installments.map((installment) => {
            const category = installment.categoryId
              ? categoriesById.get(installment.categoryId)
              : undefined;
            const Icon = category ? categoryPresentation(category).Icon : ShoppingBag;
            return (
              <div className="wlx-invoice-item" key={installment.id}>
                <span className={category ? "tlx-tone-red" : "tlx-tone-blue"}>
                  <Icon aria-hidden="true" size={15} />
                </span>
                <div className="wlx-invoice-item-info">
                  <strong>
                    {installment.description}
                    {installment.installmentCount > 1 ? (
                      <span className="wlx-installment-chip">
                        {installment.installmentNumber}/{installment.installmentCount}
                      </span>
                    ) : null}
                  </strong>
                  <span>
                    {dayMonthFormatter.format(new Date(installment.purchaseDate))}
                    {category ? ` · ${category.name}` : ""}
                  </span>
                </div>
                <span>{formatCurrency(installment.installmentAmount)}</span>
              </div>
            );
          })
        )}

        <WalletPurchasesSection creditCardId={card.id} />

        <button
          className="wlx-add-row"
          onClick={onCreatePurchase}
          style={{ marginTop: 14, width: "100%" }}
          type="button"
        >
          <ReceiptText aria-hidden="true" size={14} />
          <span>Nova compra no cartão</span>
        </button>
      </div>

      <div className="wlx-invoice-foot">
        <div className="wlx-invoice-foot-note">
          <Info aria-hidden="true" color="var(--blue)" size={14} />
          <span>Ao pagar, o valor sai da conta escolhida.</span>
        </div>
        <button
          className="wlx-pay-button"
          disabled={!canPay}
          onClick={() => invoice && onPay(invoice)}
          type="button"
        >
          {invoice?.status === "paid" ? "Fatura paga" : "Pagar fatura"}
        </button>
      </div>
    </aside>
  );
}
