import type { CreditCard, CreditCardInvoiceWithInstallments } from "@/api/generated/client";

export type WalletCardSelection = {
  /** Cartão ativo atualmente selecionado (com fallback para o primeiro). */
  selectedCard: CreditCard | undefined;
  /** Faturas pertencentes ao cartão selecionado, na ordem retornada pela API. */
  cardInvoices: CreditCardInvoiceWithInstallments[];
  /** Fatura selecionada dentro do cartão (com fallback para a primeira). */
  selectedInvoice: CreditCardInvoiceWithInstallments | undefined;
  /** Faturas cujo cartão não está na lista ativa retornada pela API. */
  orphanInvoices: CreditCardInvoiceWithInstallments[];
};

export type ResolveWalletCardSelectionParams = {
  creditCards: CreditCard[];
  invoices: CreditCardInvoiceWithInstallments[];
  selectedCardId: string | null;
  selectedInvoiceId: string | null;
};

/**
 * Deriva a seleção de cartão/fatura de forma tolerante a falhas:
 *
 * - todo cartão ativo permanece selecionável, mesmo sem fatura;
 * - a fatura selecionada é sempre uma fatura do cartão selecionado;
 * - quando a seleção desaparece, a primeira opção compatível vira fallback;
 * - faturas sem cartão ativo não são descartadas, ficam em `orphanInvoices`.
 */
export function resolveWalletCardSelection({
  creditCards,
  invoices,
  selectedCardId,
  selectedInvoiceId,
}: ResolveWalletCardSelectionParams): WalletCardSelection {
  const activeCardIds = new Set(creditCards.map((card) => card.id));
  const orphanInvoices = invoices.filter((invoice) => !activeCardIds.has(invoice.creditCardId));

  const selectedCard = creditCards.find((card) => card.id === selectedCardId) ?? creditCards[0];
  const cardInvoices = selectedCard
    ? invoices.filter((invoice) => invoice.creditCardId === selectedCard.id)
    : [];
  const selectedInvoice =
    cardInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? cardInvoices[0];

  return { selectedCard, cardInvoices, selectedInvoice, orphanInvoices };
}
