import { z } from "zod";

import type {
  CategoryBudgetOverviewBudgetsItem,
  CreateCategoryBudgetRequest,
  UpdateCategoryBudgetRequest,
} from "@/api/generated/client";
import type { PlanningPeriod } from "@/features/planning/lib/planning-period";
import { isDecimal12_2, parseFiniteMoneyNumber, toApiMoney } from "@/lib/money-input";

const budgetLimitField = z
  .string()
  .refine((value) => value.trim().length > 0, { error: "Informe o limite mensal." })
  .refine(isDecimal12_2, {
    error: "Use um valor de até dez dígitos inteiros e duas casas decimais.",
  })
  .refine((value) => parseFiniteMoneyNumber(value) > 0, {
    error: "Informe um limite maior que zero.",
  });

export const categoryBudgetFormSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria."),
  limitAmount: budgetLimitField,
  warningPercentage: z
    .number()
    .int("Use um percentual inteiro.")
    .min(1, "Informe um percentual entre 1 e 100.")
    .max(100, "Informe um percentual entre 1 e 100."),
});

export type CategoryBudgetFormValues = z.infer<typeof categoryBudgetFormSchema>;

export function defaultCategoryBudgetFormValues(categoryId = ""): CategoryBudgetFormValues {
  return {
    categoryId,
    limitAmount: "",
    warningPercentage: 80,
  };
}

export function toCreateCategoryBudgetPayload(
  values: CategoryBudgetFormValues,
  period: PlanningPeriod,
): CreateCategoryBudgetRequest {
  return {
    categoryId: values.categoryId,
    year: period.year,
    month: period.month,
    limitAmount: toApiMoney(values.limitAmount),
    warningPercentage: values.warningPercentage,
  };
}

export function toUpdateCategoryBudgetPayload(
  values: CategoryBudgetFormValues,
): UpdateCategoryBudgetRequest {
  return {
    limitAmount: toApiMoney(values.limitAmount),
    warningPercentage: values.warningPercentage,
  };
}

export function toCategoryBudgetFormValues(
  budget: CategoryBudgetOverviewBudgetsItem,
): CategoryBudgetFormValues {
  return {
    categoryId: budget.category.id,
    limitAmount: budget.limitAmount,
    warningPercentage: budget.warningPercentage,
  };
}
