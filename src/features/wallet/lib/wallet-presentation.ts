import type { AccountType } from "@/api/generated/client";

export { getInvoiceStatusLabel } from "@/lib/financial-presentation";

const accountTypeLabels: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira digital",
  cash: "Dinheiro",
  investment: "Investimento",
  other: "Outra conta",
};

export const ACCOUNT_TYPE_OPTIONS = (Object.keys(accountTypeLabels) as AccountType[]).map(
  (value) => ({ value, label: accountTypeLabels[value] }),
);

const utcDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const utcDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function getAccountTypeLabel(type: AccountType) {
  return accountTypeLabels[type];
}

export function formatUtcDate(value: string) {
  return utcDateFormatter.format(new Date(value));
}

export function formatUtcDateTime(value: string) {
  return `${utcDateTimeFormatter.format(new Date(value))} UTC`;
}

export function isSafeHexColor(value: string | null) {
  return Boolean(value && /^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/.test(value));
}

export function formatUnknownStatus(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
