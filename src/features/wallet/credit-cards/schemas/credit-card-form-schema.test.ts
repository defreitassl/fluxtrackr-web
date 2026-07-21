import { describe, expect, it } from "vitest";

import { creditCardFormSchema } from "@/features/wallet/credit-cards/schemas/credit-card-form-schema";
import { creditCardPurchaseFormSchema } from "@/features/wallet/credit-cards/schemas/credit-card-purchase-form-schema";
import { payCreditCardInvoiceFormSchema } from "@/features/wallet/credit-cards/schemas/pay-credit-card-invoice-form-schema";

const card = {
  accountId: "",
  name: "Cartão principal",
  bankName: "",
  brand: "",
  lastFourDigits: "",
  limitAmount: "3000,00",
  closingDay: "",
  dueDay: "17",
  color: "",
};

const purchase = {
  creditCardId: "card-1",
  categoryId: "",
  description: "Mercado",
  totalAmount: "189,90",
  purchaseDate: "2026-07-20T14:30",
  installmentCount: "1",
};

describe("credit card form schemas", () => {
  it("accepts the API-supported card fields and optional metadata", () => {
    expect(creditCardFormSchema.safeParse(card).success).toBe(true);
    expect(creditCardFormSchema.safeParse({ ...card, lastFourDigits: "4242", closingDay: "20", color: "#197147" }).success).toBe(true);
  });

  it("rejects invalid card days, last digits and negative limits", () => {
    expect(creditCardFormSchema.safeParse({ ...card, dueDay: "32" }).success).toBe(false);
    expect(creditCardFormSchema.safeParse({ ...card, closingDay: "2.5" }).success).toBe(false);
    expect(creditCardFormSchema.safeParse({ ...card, lastFourDigits: "42" }).success).toBe(false);
    expect(creditCardFormSchema.safeParse({ ...card, limitAmount: "-10" }).success).toBe(false);
  });

  it("requires a positive purchase total and between one and 120 installments", () => {
    expect(creditCardPurchaseFormSchema.safeParse(purchase).success).toBe(true);
    expect(creditCardPurchaseFormSchema.safeParse({ ...purchase, totalAmount: "0" }).success).toBe(false);
    expect(creditCardPurchaseFormSchema.safeParse({ ...purchase, installmentCount: "121" }).success).toBe(false);
  });

  it("requires an account for full invoice payment but permits API-default payment time", () => {
    expect(payCreditCardInvoiceFormSchema.safeParse({ accountId: "account-1", paidAt: "" }).success).toBe(true);
    expect(payCreditCardInvoiceFormSchema.safeParse({ accountId: "", paidAt: "" }).success).toBe(false);
  });
});
