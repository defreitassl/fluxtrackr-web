import {
  createFixedExpense,
  createFixedIncome,
  createTransaction,
  deleteTransaction,
  getMonthlySummary,
  listAccounts,
  listCategories,
  listTransactions,
  updateTransaction,
  type Account,
  type Category,
  type CreateFixedExpenseRequest,
  type CreateFixedIncomeRequest,
  type CreateTransactionRequest,
  type FixedExpense,
  type FixedIncome,
  type ListTransactionsParams,
  type MonthlySummary,
  type Transaction,
  type UpdateTransactionRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function responseData<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const listTransactionsData = async (params: ListTransactionsParams) => responseData<Transaction[]>(await listTransactions(params), 200);
export const listTransactionCategoriesData = async () => responseData<Category[]>(await listCategories({ includeArchived: true }), 200);
export const listTransactionAccountsData = async () => responseData<Account[]>(await listAccounts(), 200);
export const getTransactionMonthlySummaryData = async (year: number, month: number) => responseData<MonthlySummary>(await getMonthlySummary({ year, month }), 200);
export const createTransactionData = async (request: CreateTransactionRequest) => responseData<Transaction>(await createTransaction(request), 201);
export const updateTransactionData = async (id: string, request: UpdateTransactionRequest) => responseData<Transaction>(await updateTransaction(id, request), 200);
export const deleteTransactionData = async (id: string) => responseData<{ deleted: true }>(await deleteTransaction(id), 200);
export const createFixedExpenseData = async (request: CreateFixedExpenseRequest) => responseData<FixedExpense>(await createFixedExpense(request), 201);
export const createFixedIncomeData = async (request: CreateFixedIncomeRequest) => responseData<FixedIncome>(await createFixedIncome(request), 201);
