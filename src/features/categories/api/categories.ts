import {
  archiveCategory,
  createCategory,
  listCategories,
  updateCategory,
  type Category,
  type CreateCategoryRequest,
  type ListCategoriesParams,
  type UpdateCategoryRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function payload<T>(response: { status: number; data: unknown }, status: number): T {
  if (response.status !== status) throw new ApiError(response.status, response.data);
  return response.data as T;
}

export const listCategoriesData = async (params: ListCategoriesParams) =>
  payload<Category[]>(await listCategories(params), 200);
export const createCategoryData = async (request: CreateCategoryRequest) =>
  payload<Category>(await createCategory(request), 201);
export const updateCategoryData = async (id: string, request: UpdateCategoryRequest) =>
  payload<Category | { archived: { budgetIds: string[] }; category: null }>(await updateCategory(id, request), 200);
export const archiveCategoryData = async (id: string) => payload<{ archived: true }>(await archiveCategory(id), 200);

export type CategoryMutationResult = Category | { archived: true } | { archived: { budgetIds: string[] }; category: null };
