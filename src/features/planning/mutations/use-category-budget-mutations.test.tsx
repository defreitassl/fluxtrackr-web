import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/planning/api/category-budgets", () => ({
  archiveCategoryBudgetData: vi.fn(),
  createCategoryBudgetData: vi.fn(),
  updateCategoryBudgetData: vi.fn(),
}));

import { createCategoryBudgetData } from "@/features/planning/api/category-budgets";
import { useCreateCategoryBudget } from "@/features/planning/mutations/use-category-budget-mutations";

afterEach(() => vi.resetAllMocks());

describe("useCreateCategoryBudget", () => {
  it("invalidates only the planning dependents without optimistic writes", async () => {
    vi.mocked(createCategoryBudgetData).mockResolvedValue({ id: "budget-1" } as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const setQueryData = vi.spyOn(queryClient, "setQueryData");
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateCategoryBudget(), { wrapper });

    await result.current.mutateAsync({
      categoryId: "category-1",
      year: 2026,
      month: 7,
      limitAmount: "100.00",
      warningPercentage: 80,
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["category-budget-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["category-budgets"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(setQueryData).not.toHaveBeenCalled();
  });
});
