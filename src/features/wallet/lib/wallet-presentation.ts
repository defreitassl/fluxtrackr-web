import type { AccountType, CreditCardInvoiceStatus } from "@/api/generated/client";

const accountTypeLabels: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira digital",
  cash: "Dinheiro",
  investment: "Investimento",
  other: "Outra conta",
};

const invoiceStatusLabels: Record<CreditCardInvoiceStatus, string> = {
  open: "Em aberto",
  closed: "Fechada",
  paid: "Paga",
  overdue: "Vencida",
  canceled: "Cancelada",
};

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

export function getInvoiceStatusLabel(status: CreditCardInvoiceStatus) {
  return invoiceStatusLabels[status];
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
