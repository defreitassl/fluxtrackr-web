import { describe, expect, it } from "vitest";

import { resolveWalletCardSelection } from "@/features/wallet/lib/wallet-selection";

const card = (id: string) => ({ id, name: `Cartão ${id}` }) as never;
const invoice = (id: string, creditCardId: string) => ({ id, creditCardId }) as never;

describe("resolveWalletCardSelection", () => {
  it("keeps a card without invoices selectable and clears the invoice", () => {
    const result = resolveWalletCardSelection({
      creditCards: [card("card-1")],
      invoices: [],
      selectedCardId: "card-1",
      selectedInvoiceId: null,
    });

    expect(result.selectedCard?.id).toBe("card-1");
    expect(result.cardInvoices).toHaveLength(0);
    expect(result.selectedInvoice).toBeUndefined();
  });

  it("selects the first invoice of a card automatically", () => {
    const result = resolveWalletCardSelection({
      creditCards: [card("card-1")],
      invoices: [invoice("inv-1", "card-1")],
      selectedCardId: "card-1",
      selectedInvoiceId: null,
    });

    expect(result.selectedInvoice?.id).toBe("inv-1");
  });

  it("allows choosing among multiple invoices of the selected card", () => {
    const result = resolveWalletCardSelection({
      creditCards: [card("card-1")],
      invoices: [invoice("inv-1", "card-1"), invoice("inv-2", "card-1")],
      selectedCardId: "card-1",
      selectedInvoiceId: "inv-2",
    });

    expect(result.cardInvoices).toHaveLength(2);
    expect(result.selectedInvoice?.id).toBe("inv-2");
  });

  it("never selects an invoice belonging to another card", () => {
    const result = resolveWalletCardSelection({
      creditCards: [card("card-1"), card("card-2")],
      invoices: [invoice("inv-1", "card-1"), invoice("inv-2", "card-2")],
      selectedCardId: "card-1",
      selectedInvoiceId: "inv-2",
    });

    // inv-2 pertence ao card-2, então cai para a primeira fatura do card-1.
    expect(result.selectedInvoice?.id).toBe("inv-1");
  });

  it("keeps invoices without an active card accessible as orphans", () => {
    const result = resolveWalletCardSelection({
      creditCards: [card("card-1")],
      invoices: [invoice("inv-1", "card-1"), invoice("inv-orphan", "archived-card")],
      selectedCardId: "card-1",
      selectedInvoiceId: null,
    });

    expect(result.orphanInvoices.map((invoiceItem) => invoiceItem.id)).toEqual(["inv-orphan"]);
    expect(result.cardInvoices.map((invoiceItem) => invoiceItem.id)).toEqual(["inv-1"]);
  });

  it("falls back to the first card when the selection disappears", () => {
    const result = resolveWalletCardSelection({
      creditCards: [card("card-1"), card("card-2")],
      invoices: [],
      selectedCardId: "removed-card",
      selectedInvoiceId: null,
    });

    expect(result.selectedCard?.id).toBe("card-1");
  });
});
