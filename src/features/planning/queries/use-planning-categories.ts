"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { Category } from "@/api/generated/client";
import { listPlanningCategoriesData } from "@/features/planning/api/category-budgets";
import { ApiError } from "@/lib/http";

export const planningCategoriesQueryKey = ["planning-categories"] as const;

export function usePlanningCategories() {
  return useQuery<Category[], ApiError>({
    queryKey: planningCategoriesQueryKey,
    queryFn: listPlanningCategoriesData,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
