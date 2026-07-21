import type { ListTransactionsParams, PaymentMethod, TransactionType } from "@/api/generated/client";

export type TransactionsFilters = {
  /** "" = todo o período; senão "YYYY-MM" */
  month: string;
  type: "" | TransactionType;
  accountId: string;
  categoryId: string;
  paymentMethod: "" | PaymentMethod;
  /** filtro client-side de "Mais filtros" */
  source: "" | "app" | "telegram";
};

export function currentMonthValue(reference = new Date()) {
  return `${reference.getUTCFullYear()}-${String(reference.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const initialTransactionsFilters: TransactionsFilters = {
  month: currentMonthValue(),
  type: "",
  accountId: "",
  categoryId: "",
  paymentMethod: "",
  source: "",
};

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function monthOptionLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  const label = monthLabelFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1).replace(" de ", " ");
}

/** últimos 12 meses + próximos 2, mais "Todo o período" */
export function monthOptions(reference = new Date()) {
  const options: Array<{ value: string; label: string }> = [];
  for (let offset = 2; offset >= -12; offset -= 1) {
    const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + offset, 1));
    const value = currentMonthValue(date);
    options.push({ value, label: monthOptionLabel(value) });
  }
  options.push({ value: "", label: "Todo o período" });
  return options;
}

export function toListParams(filters: TransactionsFilters): ListTransactionsParams {
  const params: ListTransactionsParams = {};
  if (filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    params.startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    params.endDate = new Date(Date.UTC(year, month, 1) - 1).toISOString();
  }
  if (filters.type) params.type = filters.type;
  if (filters.accountId) params.accountId = filters.accountId;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
  return params;
}
