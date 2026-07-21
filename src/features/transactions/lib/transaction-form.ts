import { z } from "zod";

import {
  PaymentMethod,
  TransactionType,
  type Category,
  type CreateTransactionRequest,
  type Transaction,
  type UpdateTransactionRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";
import { isDecimal12_2, parseFiniteMoneyNumber } from "@/lib/money-input";

const transactionTypeValues = Object.values(TransactionType) as [TransactionType, ...TransactionType[]];
const paymentMethodValues = Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]];

export const transactionFormSchema = z.object({
  type: z.enum(transactionTypeValues),
  amount: z.string().refine((value) => value.trim().length > 0, { error: "Informe o valor." }).refine(isDecimal12_2, { error: "Use um valor com no máximo duas casas decimais." }).refine((value) => parseFiniteMoneyNumber(value) > 0, { error: "Informe um valor maior que zero." }),
  description: z.string().refine((value) => value.trim().length > 0, { error: "Informe uma descrição." }),
  occurredAt: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), { error: "Informe uma data e hora válidas." }),
  categoryId: z.string(),
  accountId: z.string(),
  paymentMethod: z.union([z.literal(""), z.enum(paymentMethodValues)]),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const transactionTypeOptions: Array<{ value: TransactionType; label: string }> = [{ value: "income", label: "Receita" }, { value: "expense", label: "Despesa" }];
export const paymentMethodOptions = (Object.values(PaymentMethod) as PaymentMethod[]).map((value) => ({ value, label: ({ pix: "PIX", debit: "Débito", credit: "Crédito", cash: "Dinheiro", transfer: "Transferência", boleto: "Boleto" } satisfies Record<PaymentMethod, string>)[value] }));

export function transactionTypeLabel(type: TransactionType) { return transactionTypeOptions.find((option) => option.value === type)?.label ?? type; }
export function paymentMethodLabel(method: PaymentMethod | null) { return method ? paymentMethodOptions.find((option) => option.value === method)?.label ?? method : "Não informado"; }

function pad(value: number) { return String(value).padStart(2, "0"); }
export function isoToDateTimeLocal(value: string) { const date = new Date(value); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
export function nowDateTimeLocal() { return isoToDateTimeLocal(new Date().toISOString()); }

export function toTransactionFormValues(transaction?: Transaction): TransactionFormValues {
  return transaction ? { type: transaction.type, amount: transaction.amount, description: transaction.description, occurredAt: isoToDateTimeLocal(transaction.occurredAt), categoryId: transaction.categoryId ?? "", accountId: transaction.accountId ?? "", paymentMethod: transaction.paymentMethod ?? "" } : { type: "expense", amount: "", description: "", occurredAt: nowDateTimeLocal(), categoryId: "", accountId: "", paymentMethod: "" };
}

function corePayload(values: TransactionFormValues) {
  return { type: values.type, amount: parseFiniteMoneyNumber(values.amount), description: values.description.trim(), occurredAt: new Date(values.occurredAt).toISOString(), ...(values.categoryId ? { categoryId: values.categoryId } : {}), ...(values.accountId ? { accountId: values.accountId } : {}), ...(values.paymentMethod ? { paymentMethod: values.paymentMethod } : {}) };
}

export function toCreateTransactionPayload(values: TransactionFormValues): CreateTransactionRequest { return { ...corePayload(values), source: "app" }; }

export function toUpdateTransactionPayload(values: TransactionFormValues, initial: Transaction): UpdateTransactionRequest {
  const payload: UpdateTransactionRequest = {};
  const value = parseFiniteMoneyNumber(values.amount);
  const occurredAt = new Date(values.occurredAt).toISOString();
  if (values.type !== initial.type) payload.type = values.type;
  if (value !== Number(initial.amount)) payload.amount = value;
  if (values.description.trim() !== initial.description) payload.description = values.description.trim();
  if (occurredAt !== initial.occurredAt) payload.occurredAt = occurredAt;
  if (values.categoryId !== (initial.categoryId ?? "")) payload.categoryId = values.categoryId || null;
  if (values.accountId !== (initial.accountId ?? "")) payload.accountId = values.accountId || null;
  if (values.paymentMethod !== (initial.paymentMethod ?? "")) payload.paymentMethod = values.paymentMethod || null;
  return payload;
}

export function compatibleCategories(categories: Category[], type: TransactionType) { return categories.filter((category) => category.isActive && (category.type === type || category.type === "both")); }

export function getTransactionErrorMessage(error: unknown, action: "save" | "delete" = "save") {
  if (error instanceof ApiError) {
    if (error.status === 400) return "Verifique os dados da transação e tente novamente.";
    if (error.status === 404) return "A transação não foi encontrada. Atualize a lista e tente novamente.";
    if (error.status === 409) return "A transação foi alterada durante a operação. Atualize os dados e tente novamente.";
    if (error.status === 503) return "Serviço indisponível. Tente novamente.";
  }
  return action === "delete" ? "Não foi possível excluir a transação." : "Não foi possível salvar a transação.";
}
