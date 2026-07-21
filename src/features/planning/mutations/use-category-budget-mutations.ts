"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  ArchivedResponse,
  CategoryBudget,
  CreateCategoryBudgetRequest,
  UpdateCategoryBudgetRequest,
} from "@/api/generated/client";
import {
  archiveCategoryBudgetData,
  createCategoryBudgetData,
  updateCategoryBudgetData,
} from "@/features/planning/api/category-budgets";
import { ApiError } from "@/lib/http";

async function invalidateCategoryBudgetRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["category-budget-overview"] }),
    queryClient.invalidateQueries({ queryKey: ["category-budgets"] }),
    queryClient.invalidateQueries({ queryKey: ["financial-timeline"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
  ]);
}

export function useCreateCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation<CategoryBudget, ApiError, CreateCategoryBudgetRequest>({
    mutationFn: createCategoryBudgetData,
    onSuccess: () => invalidateCategoryBudgetRelatedQueries(queryClient),
  });
}

export type UpdateCategoryBudgetVariables = {
  id: string;
  payload: UpdateCategoryBudgetRequest;
};

export function useUpdateCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation<CategoryBudget, ApiError, UpdateCategoryBudgetVariables>({
    mutationFn: ({ id, payload }) => updateCategoryBudgetData(id, payload),
    onSuccess: () => invalidateCategoryBudgetRelatedQueries(queryClient),
  });
}

export function useArchiveCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation<ArchivedResponse, ApiError, string>({
    mutationFn: archiveCategoryBudgetData,
    onSuccess: () => invalidateCategoryBudgetRelatedQueries(queryClient),
  });
}
