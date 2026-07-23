"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  CanceledResponse,
  CreateFinancialGoalRequest,
  CreateGoalContributionRequest,
  FinancialGoal,
  GoalContribution,
  UpdateFinancialGoalRequest,
} from "@/api/generated/client";
import {
  cancelFinancialGoalData,
  createFinancialGoalData,
  createGoalContributionData,
  updateFinancialGoalData,
} from "@/features/goals/api/financial-goals";
import { ApiError } from "@/lib/http";

/**
 * Aportes não movimentam contas: invalidação restrita ao overview de metas
 * (+ dashboard, que exibe metas) — nunca wallet/transactions.
 */
function invalidateGoalRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["financial-goals-overview"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
  ]);
}

export function useCreateFinancialGoal() {
  const queryClient = useQueryClient();

  return useMutation<FinancialGoal, ApiError, CreateFinancialGoalRequest>({
    mutationFn: createFinancialGoalData,
    onSuccess: () => invalidateGoalRelatedQueries(queryClient),
  });
}

export type UpdateFinancialGoalVariables = {
  id: string;
  payload: UpdateFinancialGoalRequest;
};

export function useUpdateFinancialGoal() {
  const queryClient = useQueryClient();

  return useMutation<FinancialGoal, ApiError, UpdateFinancialGoalVariables>({
    mutationFn: ({ id, payload }) => updateFinancialGoalData(id, payload),
    onSuccess: () => invalidateGoalRelatedQueries(queryClient),
  });
}

export function useCancelFinancialGoal() {
  const queryClient = useQueryClient();

  return useMutation<CanceledResponse, ApiError, string>({
    mutationFn: cancelFinancialGoalData,
    onSuccess: () => invalidateGoalRelatedQueries(queryClient),
  });
}

export type CreateGoalContributionVariables = {
  goalId: string;
  payload: CreateGoalContributionRequest;
};

export function useCreateGoalContribution() {
  const queryClient = useQueryClient();

  return useMutation<GoalContribution, ApiError, CreateGoalContributionVariables>({
    mutationFn: ({ goalId, payload }) => createGoalContributionData(goalId, payload),
    onSuccess: async (_, { goalId }) => {
      await Promise.all([
        invalidateGoalRelatedQueries(queryClient),
        queryClient.invalidateQueries({ queryKey: ["goal-contributions", goalId] }),
      ]);
    },
  });
}
