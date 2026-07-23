import { z } from "zod";

import {
  PaymentMethod,
  type CreateFixedExpenseRequest,
  type CreateFixedIncomeRequest,
  type FixedExpense,
  type FixedIncome,
  type UpdateFixedExpenseRequest,
  type UpdateFixedIncomeRequest,
} from "@/api/generated/client";
import { isDecimal12_2, parseFiniteMoneyNumber } from "@/lib/money-input";

const paymentMethodValues = Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]];

export type FixedKind = "expense" | "income";
export type FixedTemplate = FixedExpense | FixedIncome;

export const fixedFormSchema = z
  .object({
    name: z.string().refine((value) => value.trim().length > 0, { error: "Informe o nome da recorrência." }),
    amount: z
      .string()
      .refine((value) => value.trim().length > 0, { error: "Informe o valor." })
      .refine(isDecimal12_2, { error: "Use um valor com no máximo duas casas decimais." })
      .refine((value) => parseFiniteMoneyNumber(value) > 0, { error: "Informe um valor maior que zero." }),
    day: z.string(),
    categoryId: z.string(),
    accountId: z.string(),
    paymentMethod: z.union([z.literal(""), z.enum(paymentMethodValues)]),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.day) {
      const day = Number(values.day);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        context.addIssue({ code: "custom", path: ["day"], message: "Informe um dia entre 1 e 31." });
      }
    }

    if (values.paymentMethod === "credit") {
      context.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Crédito não é permitido para recorrências em conta.",
      });
    }
  });

export type FixedFormValues = z.infer<typeof fixedFormSchema>;

function fixedDay(template: FixedTemplate, kind: FixedKind) {
  return kind === "expense"
    ? (template as FixedExpense).dueDay
    : (template as FixedIncome).receiveDay;
}

export function toFixedFormValues(kind: FixedKind, template?: FixedTemplate): FixedFormValues {
  return {
    name: template?.name ?? "",
    amount: template?.amount ?? "",
    day: template ? String(fixedDay(template, kind) ?? "") : "",
    categoryId: template?.categoryId ?? "",
    accountId: template?.accountId ?? "",
    paymentMethod: template?.paymentMethod ?? "",
    isActive: template?.isActive ?? true,
  };
}

function basePayload(values: FixedFormValues) {
  const day = values.day ? Number(values.day) : undefined;
  return {
    name: values.name.trim(),
    amount: parseFiniteMoneyNumber(values.amount),
    ...(day ? { day } : {}),
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
    ...(values.accountId ? { accountId: values.accountId } : {}),
    ...(values.paymentMethod ? { paymentMethod: values.paymentMethod as PaymentMethod } : {}),
    isActive: values.isActive,
  };
}

export function toCreateFixedPayload(
  kind: "expense",
  values: FixedFormValues,
): CreateFixedExpenseRequest;
export function toCreateFixedPayload(
  kind: "income",
  values: FixedFormValues,
): CreateFixedIncomeRequest;
export function toCreateFixedPayload(kind: FixedKind, values: FixedFormValues) {
  const payload = basePayload(values);
  const { day, ...rest } = payload;
  return kind === "expense"
    ? { ...rest, ...(day ? { dueDay: day } : {}) }
    : { ...rest, ...(day ? { receiveDay: day } : {}) };
}

export function toUpdateFixedPayload(
  kind: "expense",
  values: FixedFormValues,
): UpdateFixedExpenseRequest;
export function toUpdateFixedPayload(
  kind: "income",
  values: FixedFormValues,
): UpdateFixedIncomeRequest;
export function toUpdateFixedPayload(kind: FixedKind, values: FixedFormValues) {
  const day = values.day ? Number(values.day) : null;
  const base = {
    name: values.name.trim(),
    amount: parseFiniteMoneyNumber(values.amount),
    categoryId: values.categoryId || null,
    accountId: values.accountId || null,
    paymentMethod: values.paymentMethod || null,
    isActive: values.isActive,
  };
  return kind === "expense" ? { ...base, dueDay: day } : { ...base, receiveDay: day };
}
