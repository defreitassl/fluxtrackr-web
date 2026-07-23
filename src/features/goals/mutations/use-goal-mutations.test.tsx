import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/goals/api/financial-goals", () => ({
  cancelFinancialGoalData: vi.fn(),
  createFinancialGoalData: vi.fn(),
  createGoalContributionData: vi.fn(),
  updateFinancialGoalData: vi.fn(),
}));

import {
  createFinancialGoalData,
  createGoalContributionData,
} from "@/features/goals/api/financial-goals";
import {
  useCreateFinancialGoal,
  useCreateGoalContribution,
} from "@/features/goals/mutations/use-goal-mutations";

afterEach(() => vi.resetAllMocks());

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { invalidate, wrapper };
}

describe("useCreateFinancialGoal", () => {
  it("restricts invalidation to the goals overview (never wallet/transactions)", async () => {
    vi.mocked(createFinancialGoalData).mockResolvedValue({ id: "goal-1" } as never);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateFinancialGoal(), { wrapper });

    await result.current.mutateAsync({ name: "Reserva", targetAmount: "10000.00" });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-goals-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["monthly-summary"] });
  });
});

describe("useCreateGoalContribution", () => {
  it("also invalidates the contributions of the affected goal", async () => {
    vi.mocked(createGoalContributionData).mockResolvedValue({ id: "contribution-1" } as never);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateGoalContribution(), { wrapper });

    await result.current.mutateAsync({
      goalId: "goal-1",
      payload: { type: "contribution", amount: "100.00" },
    });

    expect(createGoalContributionData).toHaveBeenCalledWith("goal-1", {
      type: "contribution",
      amount: "100.00",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-goals-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["goal-contributions", "goal-1"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["transactions"] });
  });
});
