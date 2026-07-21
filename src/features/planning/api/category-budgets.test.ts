import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  archiveCategoryBudget: vi.fn(),
  createCategoryBudget: vi.fn(),
  getCategoryBudgetOverview: vi.fn(),
  listCategories: vi.fn(),
  updateCategoryBudget: vi.fn(),
}));

import {
  createCategoryBudget,
  getCategoryBudgetOverview,
  listCategories,
  updateCategoryBudget,
} from "@/api/generated/client";
import {
  createCategoryBudgetData,
  getCategoryBudgetOverviewData,
  listPlanningCategoriesData,
  updateCategoryBudgetData,
} from "@/features/planning/api/category-budgets";

describe("category budget API adapters", () => {
  it("unwraps overview data and sends the selected UTC period", async () => {
    const overview = { year: 2026, month: 7, summary: {}, budgets: [] };
    vi.mocked(getCategoryBudgetOverview).mockResolvedValue({ status: 200, data: overview } as never);

    await expect(getCategoryBudgetOverviewData({ year: 2026, month: 7 })).resolves.toBe(overview);
    expect(getCategoryBudgetOverview).toHaveBeenCalledWith({ year: 2026, month: 7 });
  });

  it("lists only active categories for the planning presentation", async () => {
    const categories = [{ id: "category-1", name: "Mercado" }];
    vi.mocked(listCategories).mockResolvedValue({ status: 200, data: categories } as never);

    await expect(listPlanningCategoriesData()).resolves.toBe(categories as never);
    expect(listCategories).toHaveBeenCalledWith({ isActive: true });
  });

  it("keeps status failures as ApiError", async () => {
    vi.mocked(createCategoryBudget).mockResolvedValue({ status: 409, data: { message: "duplicate" } } as never);

    await expect(
      createCategoryBudgetData({
        categoryId: "category-1",
        year: 2026,
        month: 7,
        limitAmount: "100.00",
        warningPercentage: 80,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("does not add non-PATCH fields while updating", async () => {
    const request = { limitAmount: "250.00", warningPercentage: 85 };
    vi.mocked(updateCategoryBudget).mockResolvedValue({ status: 200, data: { id: "budget-1" } } as never);

    await updateCategoryBudgetData("budget-1", request);

    expect(updateCategoryBudget).toHaveBeenCalledWith("budget-1", request);
  });
});
