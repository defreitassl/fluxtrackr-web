import { z } from "zod";

import {
  CreateFinancialEventRequestRecurrence,
  PaymentMethod,
  TransactionType,
  type CreateFinancialEventRequest,
  type FinancialEvent,
  type UpdateFinancialEventRequest,
} from "@/api/generated/client";
import { isoToDateTimeLocal, nowDateTimeLocal } from "@/features/transactions/lib/transaction-form";
import { isDecimal12_2, parseFiniteMoneyNumber } from "@/lib/money-input";

const transactionTypeValues = Object.values(TransactionType) as [TransactionType, ...TransactionType[]];
const paymentMethodValues = Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]];
const recurrenceValues = Object.values(CreateFinancialEventRequestRecurrence) as [
  CreateFinancialEventRequestRecurrence,
  ...CreateFinancialEventRequestRecurrence[],
];

/**
 * Espelha as regras de `validateEventData` da API: receita exige conta e
 * proíbe cartão; despesa exige exatamente um de conta/cartão; cartão proíbe
 * paymentMethod; conta proíbe o método `credit`; parcelas (1..120) só em
 * despesa no cartão.
 */
export const eventFormSchema = z
  .object({
    type: z.enum(transactionTypeValues),
    name: z.string().refine((value) => value.trim().length > 0, { error: "Informe o nome do evento." }),
    expectedAmount: z
      .string()
      .refine((value) => value.trim().length > 0, { error: "Informe o valor previsto." })
      .refine(isDecimal12_2, { error: "Use um valor com no máximo duas casas decimais." })
      .refine((value) => parseFiniteMoneyNumber(value) > 0, { error: "Informe um valor maior que zero." }),
    date: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), {
      error: "Informe uma data e hora válidas.",
    }),
    categoryId: z.string(),
    accountId: z.string(),
    creditCardId: z.string(),
    paymentMethod: z.union([z.literal(""), z.enum(paymentMethodValues)]),
    installmentCount: z.string().refine(
      (value) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed >= 1 && parsed <= 120;
      },
      { error: "Informe um número de parcelas entre 1 e 120." },
    ),
    recurrence: z.enum(recurrenceValues),
    notes: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.type === "income") {
      if (!values.accountId) {
        ctx.addIssue({ code: "custom", path: ["accountId"], message: "Receitas exigem uma conta." });
      }
      if (values.creditCardId) {
        ctx.addIssue({ code: "custom", path: ["creditCardId"], message: "Receitas não aceitam cartão." });
      }
    } else if (!!values.accountId === !!values.creditCardId) {
      ctx.addIssue({
        code: "custom",
        path: ["accountId"],
        message: "Escolha exatamente uma conta ou um cartão para a despesa.",
      });
    }

    if (values.creditCardId && values.paymentMethod) {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Eventos no cartão não aceitam método de pagamento.",
      });
    }
    if (values.accountId && values.paymentMethod === "credit") {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Eventos em conta não aceitam o método crédito.",
      });
    }
    if (Number(values.installmentCount) !== 1 && !(values.type === "expense" && values.creditCardId)) {
      ctx.addIssue({
        code: "custom",
        path: ["installmentCount"],
        message: "Parcelas só são permitidas em despesas no cartão.",
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

export function defaultEventFormValues(type: TransactionType = "expense"): EventFormValues {
  return {
    type,
    name: "",
    expectedAmount: "",
    date: nowDateTimeLocal(),
    categoryId: "",
    accountId: "",
    creditCardId: "",
    paymentMethod: "",
    installmentCount: "1",
    recurrence: "once",
    notes: "",
  };
}

export function toEventFormValues(event: FinancialEvent): EventFormValues {
  return {
    type: event.type,
    name: event.name,
    expectedAmount: event.expectedAmount,
    date: isoToDateTimeLocal(event.date),
    categoryId: event.categoryId ?? "",
    accountId: event.accountId ?? "",
    creditCardId: event.creditCardId ?? "",
    paymentMethod: event.paymentMethod ?? "",
    installmentCount: String(event.installmentCount),
    recurrence: (event.recurrence in CreateFinancialEventRequestRecurrence
      ? event.recurrence
      : "once") as CreateFinancialEventRequestRecurrence,
    notes: event.notes ?? "",
  };
}

export function toCreateEventPayload(values: EventFormValues): CreateFinancialEventRequest {
  return {
    type: values.type,
    name: values.name.trim(),
    expectedAmount: parseFiniteMoneyNumber(values.expectedAmount),
    date: new Date(values.date).toISOString(),
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
    ...(values.accountId ? { accountId: values.accountId } : {}),
    ...(values.creditCardId ? { creditCardId: values.creditCardId } : {}),
    ...(values.paymentMethod ? { paymentMethod: values.paymentMethod } : {}),
    recurrence: values.recurrence,
    installmentCount: Number(values.installmentCount),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
}

/** Diff contra o evento original; campos limpos vão como `null` (PATCH). */
export function toUpdateEventPayload(
  values: EventFormValues,
  initial: FinancialEvent,
): UpdateFinancialEventRequest {
  const payload: UpdateFinancialEventRequest = {};
  const amount = parseFiniteMoneyNumber(values.expectedAmount);
  const date = new Date(values.date).toISOString();
  const name = values.name.trim();
  const notes = values.notes.trim();

  if (values.type !== initial.type) payload.type = values.type;
  if (name !== initial.name) payload.name = name;
  if (amount !== Number(initial.expectedAmount)) payload.expectedAmount = amount;
  if (date !== initial.date) payload.date = date;
  if (values.categoryId !== (initial.categoryId ?? "")) payload.categoryId = values.categoryId || null;
  if (values.accountId !== (initial.accountId ?? "")) payload.accountId = values.accountId || null;
  if (values.creditCardId !== (initial.creditCardId ?? "")) {
    payload.creditCardId = values.creditCardId || null;
  }
  if (values.paymentMethod !== (initial.paymentMethod ?? "")) {
    payload.paymentMethod = values.paymentMethod || null;
  }
  if (values.recurrence !== initial.recurrence) payload.recurrence = values.recurrence;
  if (Number(values.installmentCount) !== initial.installmentCount) {
    payload.installmentCount = Number(values.installmentCount);
  }
  if (notes !== (initial.notes ?? "")) payload.notes = notes || null;
  return payload;
}
