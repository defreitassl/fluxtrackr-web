"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { Category, CategoryType, ListCategoriesParams } from "@/api/generated/client";
import { listCategoriesData } from "@/features/categories/api/categories";
import { ApiError } from "@/lib/http";

export type CategoryStatusFilter = "active" | "archived" | "all";
export type CategoryTypeFilter = "all" | CategoryType;

export type CategoriesFilters = { status: CategoryStatusFilter; type: CategoryTypeFilter };

export function categoriesParams(filters: CategoriesFilters): ListCategoriesParams {
  return {
    ...(filters.status === "active" ? { isActive: true } : {}),
    ...(filters.status === "archived" ? { isActive: false } : {}),
    ...(filters.status === "all" ? { includeArchived: true } : {}),
    ...(filters.type === "all" ? {} : { type: filters.type }),
  };
}

export function categoriesQueryKey(filters: CategoriesFilters) {
  return ["categories", filters] as const;
}

export function useCategories(filters: CategoriesFilters) {
  const params = categoriesParams(filters);
  return useQuery<Category[], ApiError>({
    queryKey: categoriesQueryKey(filters),
    queryFn: () => listCategoriesData(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
