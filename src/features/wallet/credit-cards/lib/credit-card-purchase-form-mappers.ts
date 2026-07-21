import type { CreateCreditCardPurchaseRequest } from "@/api/generated/client";
import type { CreditCardPurchaseFormValues } from "@/features/wallet/credit-cards/schemas/credit-card-purchase-form-schema";
import { parseFiniteMoneyNumber } from "@/lib/money-input";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function nowCreditCardPurchaseDateTimeLocal() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultCreditCardPurchaseFormValues(initialCreditCardId = ""): CreditCardPurchaseFormValues {
  return {
    creditCardId: initialCreditCardId,
    categoryId: "",
    description: "",
    totalAmount: "",
    purchaseDate: nowCreditCardPurchaseDateTimeLocal(),
    installmentCount: "1",
  };
}

export function toCreateCreditCardPurchasePayload(
  values: CreditCardPurchaseFormValues,
): CreateCreditCardPurchaseRequest {
  return {
    creditCardId: values.creditCardId,
    description: values.description.trim(),
    totalAmount: parseFiniteMoneyNumber(values.totalAmount),
    purchaseDate: new Date(values.purchaseDate).toISOString(),
    installmentCount: Number(values.installmentCount),
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
  };
}
