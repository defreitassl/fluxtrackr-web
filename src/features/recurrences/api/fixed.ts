import {
  archiveFixedExpense,
  archiveFixedIncome,
  cancelFixedOccurrence,
  listFixedExpenses,
  listFixedIncomes,
  listFixedOccurrences,
  realizeFixedOccurrence,
  updateFixedExpense,
  updateFixedIncome,
  type ArchivedResponse,
  type FixedExpense,
  type FixedIncome,
  type FixedOccurrence,
  type ListFixedOccurrencesParams,
  type RealizeFixedOccurrenceRequest,
  type RealizeFixedOccurrenceResponse,
  type UpdateFixedExpenseRequest,
  type UpdateFixedIncomeRequest,
} from "@/api/generated/client";
import {
  createFixedExpenseData,
  createFixedIncomeData,
} from "@/features/transactions/api/transactions";
import { ApiError } from "@/lib/http";

export { createFixedExpenseData, createFixedIncomeData };

function responseData<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const listFixedExpensesData = async () =>
  responseData<FixedExpense[]>(await listFixedExpenses(), 200);

export const updateFixedExpenseData = async (id: string, request: UpdateFixedExpenseRequest) =>
  responseData<FixedExpense>(await updateFixedExpense(id, request), 200);

export const archiveFixedExpenseData = async (id: string) =>
  responseData<ArchivedResponse>(await archiveFixedExpense(id), 200);

export const listFixedIncomesData = async () =>
  responseData<FixedIncome[]>(await listFixedIncomes(), 200);

export const updateFixedIncomeData = async (id: string, request: UpdateFixedIncomeRequest) =>
  responseData<FixedIncome>(await updateFixedIncome(id, request), 200);

export const archiveFixedIncomeData = async (id: string) =>
  responseData<ArchivedResponse>(await archiveFixedIncome(id), 200);

export const listFixedOccurrencesData = async (params: ListFixedOccurrencesParams = {}) =>
  responseData<FixedOccurrence[]>(await listFixedOccurrences(params), 200);

export const realizeFixedOccurrenceData = async (
  id: string,
  request: RealizeFixedOccurrenceRequest,
) => responseData<RealizeFixedOccurrenceResponse>(await realizeFixedOccurrence(id, request), 201);

export const cancelFixedOccurrenceData = async (id: string) =>
  responseData<FixedOccurrence>(await cancelFixedOccurrence(id), 201);
