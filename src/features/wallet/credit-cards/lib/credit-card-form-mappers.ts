import type {
  CreateCreditCardRequest,
  CreditCard,
  UpdateCreditCardRequest,
} from "@/api/generated/client";
import type { CreditCardFormValues } from "@/features/wallet/credit-cards/schemas/credit-card-form-schema";
import { HEX_COLOR_PATTERN } from "@/features/wallet/accounts/schemas/account-form-schema";
import { parseFiniteMoneyNumber } from "@/lib/money-input";

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function optionalText(value: string) {
  return nullableText(value) ?? undefined;
}

function normalizeColor(value: string | null) {
  return value && HEX_COLOR_PATTERN.test(value) ? value : "";
}

export function defaultCreditCardFormValues(): CreditCardFormValues {
  return {
    accountId: "",
    name: "",
    bankName: "",
    brand: "",
    lastFourDigits: "",
    limitAmount: "",
    closingDay: "",
    dueDay: "",
    color: "",
  };
}

export function toCreditCardFormValues(card: CreditCard): CreditCardFormValues {
  return {
    accountId: card.accountId ?? "",
    name: card.name,
    bankName: card.bankName ?? "",
    brand: card.brand ?? "",
    lastFourDigits: card.lastFourDigits ?? "",
    limitAmount: card.limitAmount,
    closingDay: card.closingDay ? String(card.closingDay) : "",
    dueDay: String(card.dueDay),
    color: normalizeColor(card.color),
  };
}

export function toCreateCreditCardPayload(values: CreditCardFormValues): CreateCreditCardRequest {
  const accountId = optionalText(values.accountId);
  const bankName = optionalText(values.bankName);
  const brand = optionalText(values.brand);
  const lastFourDigits = optionalText(values.lastFourDigits);
  const color = optionalText(values.color);
  const closingDay = values.closingDay ? Number(values.closingDay) : undefined;

  return {
    name: values.name.trim(),
    limitAmount: parseFiniteMoneyNumber(values.limitAmount),
    dueDay: Number(values.dueDay),
    ...(accountId ? { accountId } : {}),
    ...(bankName ? { bankName } : {}),
    ...(brand ? { brand } : {}),
    ...(lastFourDigits ? { lastFourDigits } : {}),
    ...(closingDay ? { closingDay } : {}),
    ...(color ? { color } : {}),
  };
}

export function toUpdateCreditCardPayload(values: CreditCardFormValues): UpdateCreditCardRequest {
  return {
    accountId: nullableText(values.accountId),
    name: values.name.trim(),
    bankName: nullableText(values.bankName),
    brand: nullableText(values.brand),
    lastFourDigits: nullableText(values.lastFourDigits),
    limitAmount: parseFiniteMoneyNumber(values.limitAmount),
    closingDay: values.closingDay ? Number(values.closingDay) : null,
    dueDay: Number(values.dueDay),
    color: nullableText(values.color),
  };
}
