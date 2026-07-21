"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { CategoryBudgetOverview } from "@/api/generated/client";
import { getCategoryBudgetOverviewData } from "@/features/planning/api/category-budgets";
import type { PlanningPeriod } from "@/features/planning/lib/planning-period";
import { ApiError } from "@/lib/http";

export function categoryBudgetOverviewQueryKey(period: PlanningPeriod) {
  return ["category-budget-overview", period] as const;
}

export function useCategoryBudgetOverview(period: PlanningPeriod) {
  return useQuery<CategoryBudgetOverview, ApiError>({
    queryKey: categoryBudgetOverviewQueryKey(period),
    queryFn: () => getCategoryBudgetOverviewData(period),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
