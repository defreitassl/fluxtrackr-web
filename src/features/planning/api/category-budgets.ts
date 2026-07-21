import {
  archiveCategoryBudget,
  createCategoryBudget,
  getCategoryBudgetOverview,
  listCategories,
  updateCategoryBudget,
  type ArchivedResponse,
  type Category,
  type CategoryBudget,
  type CategoryBudgetOverview,
  type CreateCategoryBudgetRequest,
  type GetCategoryBudgetOverviewParams,
  type UpdateCategoryBudgetRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function payload<T>(response: { status: number; data: unknown }, expectedStatus: number): T {
  if (response.status !== expectedStatus) {
    throw new ApiError(response.status, response.data);
  }

  return response.data as T;
}

/** Adapters finos sobre o cliente Orval: a UI nunca lida com envelopes HTTP. */
export const getCategoryBudgetOverviewData = async (params: GetCategoryBudgetOverviewParams) =>
  payload<CategoryBudgetOverview>(await getCategoryBudgetOverview(params), 200);

export const listPlanningCategoriesData = async () =>
  payload<Category[]>(await listCategories({ isActive: true }), 200);

export const createCategoryBudgetData = async (request: CreateCategoryBudgetRequest) =>
  payload<CategoryBudget>(await createCategoryBudget(request), 201);

export const updateCategoryBudgetData = async (id: string, request: UpdateCategoryBudgetRequest) =>
  payload<CategoryBudget>(await updateCategoryBudget(id, request), 200);

export const archiveCategoryBudgetData = async (id: string) =>
  payload<ArchivedResponse>(await archiveCategoryBudget(id), 200);
