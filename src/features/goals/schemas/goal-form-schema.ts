import { z } from "zod";

import {
  GoalContributionType,
  type CreateFinancialGoalRequest,
  type CreateGoalContributionRequest,
  type FinancialGoal,
  type UpdateFinancialGoalRequest,
} from "@/api/generated/client";
import { nowDateTimeLocal } from "@/features/transactions/lib/transaction-form";
import { isDecimal12_2, parseFiniteMoneyNumber, toApiMoney } from "@/lib/money-input";

const contributionTypeValues = Object.values(GoalContributionType) as [
  GoalContributionType,
  ...GoalContributionType[],
];

function positiveMoneyField(requiredMessage: string) {
  return z
    .string()
    .refine((value) => value.trim().length > 0, { error: requiredMessage })
    .refine(isDecimal12_2, { error: "Use um valor com no máximo duas casas decimais." })
    .refine((value) => parseFiniteMoneyNumber(value) > 0, { error: "Informe um valor maior que zero." });
}

export const goalFormSchema = z.object({
  name: z.string().refine((value) => value.trim().length > 0, { error: "Informe o nome da meta." }),
  description: z.string(),
  targetAmount: positiveMoneyField("Informe o valor alvo da meta."),
  /** vazio = sem prazo */
  targetDate: z
    .string()
    .refine((value) => value === "" || !Number.isNaN(new Date(value).getTime()), {
      error: "Informe uma data de prazo válida.",
    }),
  /** vazio = sem valor inicial (somente na criação) */
  initialAmount: z
    .string()
    .refine(
      (value) =>
        value.trim() === "" || (isDecimal12_2(value) && parseFiniteMoneyNumber(value) >= 0),
      { error: "Use um valor inicial positivo com até duas casas decimais." },
    ),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

export const contributionFormSchema = z.object({
  type: z.enum(contributionTypeValues),
  amount: positiveMoneyField("Informe o valor."),
  occurredAt: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      error: "Informe uma data e hora válidas.",
    })
    .refine((value) => new Date(value).getTime() <= Date.now(), {
      error: "A data do aporte não pode estar no futuro.",
    }),
  note: z.string(),
});

export type ContributionFormValues = z.infer<typeof contributionFormSchema>;

export function defaultGoalFormValues(): GoalFormValues {
  return { name: "", description: "", targetAmount: "", targetDate: "", initialAmount: "" };
}

export function toGoalFormValues(goal: FinancialGoal): GoalFormValues {
  return {
    name: goal.name,
    description: goal.description ?? "",
    targetAmount: goal.targetAmount,
    targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : "",
    initialAmount: "",
  };
}

export function defaultContributionFormValues(
  type: GoalContributionType = "contribution",
): ContributionFormValues {
  return { type, amount: "", occurredAt: nowDateTimeLocal(), note: "" };
}

/** Valores Money sempre via `toApiMoney` (string "N.NN"); nunca number. */
export function toCreateGoalPayload(values: GoalFormValues): CreateFinancialGoalRequest {
  return {
    name: values.name.trim(),
    targetAmount: toApiMoney(values.targetAmount),
    ...(values.description.trim() ? { description: values.description.trim() } : {}),
    ...(values.targetDate ? { targetDate: values.targetDate } : {}),
    ...(values.initialAmount.trim() ? { initialAmount: toApiMoney(values.initialAmount) } : {}),
  };
}

/**
 * Diff contra a meta original; campos limpos vão como `null`. `status` nunca é
 * mapeado — `completed` é derivado do progresso pela API.
 */
export function toUpdateGoalPayload(
  values: GoalFormValues,
  initial: FinancialGoal,
): UpdateFinancialGoalRequest {
  const payload: UpdateFinancialGoalRequest = {};
  const name = values.name.trim();
  const description = values.description.trim();
  const targetAmount = toApiMoney(values.targetAmount);
  const initialTargetDate = initial.targetDate ? initial.targetDate.slice(0, 10) : "";

  if (name !== initial.name) payload.name = name;
  if (description !== (initial.description ?? "")) payload.description = description || null;
  if (Number(targetAmount) !== Number(initial.targetAmount)) payload.targetAmount = targetAmount;
  if (values.targetDate !== initialTargetDate) payload.targetDate = values.targetDate || null;
  return payload;
}

export function toCreateContributionPayload(
  values: ContributionFormValues,
): CreateGoalContributionRequest {
  return {
    type: values.type,
    amount: toApiMoney(values.amount),
    occurredAt: new Date(values.occurredAt).toISOString(),
    ...(values.note.trim() ? { note: values.note.trim() } : {}),
  };
}
