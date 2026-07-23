import {
  cancelFinancialGoal,
  createFinancialGoal,
  createGoalContribution,
  getFinancialGoal,
  getFinancialGoalsOverview,
  listGoalContributions,
  type CanceledResponse,
  type CreateFinancialGoalRequest,
  type CreateGoalContributionRequest,
  type FinancialGoal,
  type FinancialGoalDetail,
  type FinancialGoalsOverview,
  type GoalContribution,
  type ListGoalContributionsParams,
  type UpdateFinancialGoalRequest,
  updateFinancialGoal,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function responseData<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const getFinancialGoalsOverviewData = async () => responseData<FinancialGoalsOverview>(await getFinancialGoalsOverview(), 200);
export const getFinancialGoalData = async (id: string) => responseData<FinancialGoalDetail>(await getFinancialGoal(id), 200);
export const createFinancialGoalData = async (request: CreateFinancialGoalRequest) => responseData<FinancialGoal>(await createFinancialGoal(request), 201);
export const updateFinancialGoalData = async (id: string, request: UpdateFinancialGoalRequest) => responseData<FinancialGoal>(await updateFinancialGoal(id, request), 200);
export const cancelFinancialGoalData = async (id: string) => responseData<CanceledResponse>(await cancelFinancialGoal(id), 200);
export const listGoalContributionsData = async (id: string, params?: ListGoalContributionsParams) => responseData<GoalContribution[]>(await listGoalContributions(id, params), 200);
export const createGoalContributionData = async (id: string, request: CreateGoalContributionRequest) => responseData<GoalContribution>(await createGoalContribution(id, request), 201);
