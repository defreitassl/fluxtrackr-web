"use client";

import { useQuery } from "@tanstack/react-query";

import type { FinancialGoalsOverview, GoalContribution } from "@/api/generated/client";
import {
  getFinancialGoalsOverviewData,
  listGoalContributionsData,
} from "@/features/goals/api/financial-goals";
import { ApiError } from "@/lib/http";

export const financialGoalsOverviewQueryKey = ["financial-goals-overview"] as const;

/** Fonte única de hero + grid da tela de metas. */
export function useFinancialGoalsOverview() {
  return useQuery<FinancialGoalsOverview, ApiError>({
    queryKey: financialGoalsOverviewQueryKey,
    queryFn: getFinancialGoalsOverviewData,
    retry: false,
  });
}

export function goalContributionsQueryKey(goalId: string) {
  return ["goal-contributions", goalId] as const;
}

/** Habilitada apenas com o drawer de aporte/resgate aberto. */
export function useGoalContributions(goalId: string | null) {
  return useQuery<GoalContribution[], ApiError>({
    queryKey: ["goal-contributions", goalId],
    queryFn: () => {
      if (!goalId) throw new Error("A consulta de aportes requer uma meta.");
      return listGoalContributionsData(goalId);
    },
    enabled: goalId !== null,
    retry: false,
  });
}
