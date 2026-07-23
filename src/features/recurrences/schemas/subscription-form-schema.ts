import { z } from "zod";

import {
  PaymentMethod,
  type CreateSubscriptionRequest,
  type Subscription,
  type UpdateSubscriptionRequest,
} from "@/api/generated/client";
import { isDecimal12_2, parseFiniteMoneyNumber } from "@/lib/money-input";

const paymentMethodValues = Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]];
const recurrenceValues = ["monthly", "semiannual", "yearly"] as const;

function isIsoDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const subscriptionFormSchema = z
  .object({
    name: z.string().refine((value) => value.trim().length > 0, { error: "Informe o nome da assinatura." }),
    amount: z
      .string()
      .refine((value) => value.trim().length > 0, { error: "Informe o valor." })
      .refine(isDecimal12_2, { error: "Use um valor com no máximo duas casas decimais." })
      .refine((value) => parseFiniteMoneyNumber(value) > 0, { error: "Informe um valor maior que zero." }),
    nextChargeDate: z.string().refine(isIsoDateInput, { error: "Informe a próxima cobrança." }),
    recurrence: z.enum(recurrenceValues),
    categoryId: z.string(),
    accountId: z.string(),
    creditCardId: z.string(),
    paymentMethod: z.union([z.literal(""), z.enum(paymentMethodValues)]),
    autoRenew: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    const hasAccount = Boolean(values.accountId);
    const hasCreditCard = Boolean(values.creditCardId);

    if (hasAccount === hasCreditCard) {
      context.addIssue({
        code: "custom",
        path: ["accountId"],
        message: "Escolha exatamente uma conta ou cartão.",
      });
    }

    if (hasAccount && !values.paymentMethod) {
      context.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Escolha o meio de pagamento da conta.",
      });
    }

    if (hasAccount && values.paymentMethod === "credit") {
      context.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Crédito só pode ser usado com cartão.",
      });
    }

    if (hasCreditCard && values.paymentMethod) {
      context.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Cartão não usa meio de pagamento adicional.",
      });
    }
  });

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

export function toSubscriptionFormValues(subscription?: Subscription): SubscriptionFormValues {
  return {
    name: subscription?.name ?? "",
    amount: subscription?.amount ?? "",
    nextChargeDate: subscription?.nextChargeDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    recurrence: subscription?.recurrence === "semiannual" || subscription?.recurrence === "yearly"
      ? subscription.recurrence
      : "monthly",
    categoryId: subscription?.categoryId ?? "",
    accountId: subscription?.accountId ?? "",
    creditCardId: subscription?.creditCardId ?? "",
    paymentMethod: subscription?.paymentMethod ?? "",
    autoRenew: subscription?.autoRenew ?? true,
    isActive: subscription?.isActive ?? true,
  };
}

function toDateTime(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function toCreateSubscriptionPayload(values: SubscriptionFormValues): CreateSubscriptionRequest {
  const accountId = values.accountId || undefined;
  const creditCardId = values.creditCardId || undefined;

  return {
    name: values.name.trim(),
    amount: parseFiniteMoneyNumber(values.amount),
    nextChargeDate: toDateTime(values.nextChargeDate),
    recurrence: values.recurrence,
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
    ...(accountId ? { accountId, paymentMethod: values.paymentMethod as PaymentMethod } : { creditCardId, paymentMethod: null }),
    autoRenew: values.autoRenew,
    isActive: values.isActive,
  };
}

export function toUpdateSubscriptionPayload(
  values: SubscriptionFormValues,
  initial: Subscription,
): UpdateSubscriptionRequest {
  const payload: UpdateSubscriptionRequest = {};
  const amount = parseFiniteMoneyNumber(values.amount);
  const nextChargeDate = toDateTime(values.nextChargeDate);

  if (values.name.trim() !== initial.name) payload.name = values.name.trim();
  if (amount !== Number(initial.amount)) payload.amount = amount;
  if (values.nextChargeDate !== initial.nextChargeDate.slice(0, 10)) payload.nextChargeDate = nextChargeDate;
  if (values.recurrence !== initial.recurrence) payload.recurrence = values.recurrence;
  if (values.categoryId !== (initial.categoryId ?? "")) payload.categoryId = values.categoryId || null;

  const destinationChanged =
    values.accountId !== (initial.accountId ?? "") ||
    values.creditCardId !== (initial.creditCardId ?? "");
  if (destinationChanged) {
    // A API resolve uma mudança de destino como um conjunto atômico. Enviar o
    // trio evita manter o cartão ou o método anterior ao trocar para conta,
    // e vice-versa.
    payload.accountId = values.accountId || null;
    payload.creditCardId = values.creditCardId || null;
    payload.paymentMethod = values.paymentMethod || null;
  } else if (values.paymentMethod !== (initial.paymentMethod ?? "")) {
    payload.paymentMethod = values.paymentMethod || null;
  }
  if (values.autoRenew !== initial.autoRenew) payload.autoRenew = values.autoRenew;
  if (values.isActive !== initial.isActive) payload.isActive = values.isActive;

  return payload;
}
