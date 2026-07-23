import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  cancelFinancialGoal: vi.fn(),
  createFinancialGoal: vi.fn(),
  createGoalContribution: vi.fn(),
  getFinancialGoal: vi.fn(),
  getFinancialGoalsOverview: vi.fn(),
  listGoalContributions: vi.fn(),
  updateFinancialGoal: vi.fn(),
}));

import {
  cancelFinancialGoal,
  createFinancialGoal,
  createGoalContribution,
  getFinancialGoalsOverview,
  listGoalContributions,
} from "@/api/generated/client";
import {
  cancelFinancialGoalData,
  createFinancialGoalData,
  createGoalContributionData,
  getFinancialGoalsOverviewData,
  listGoalContributionsData,
} from "@/features/goals/api/financial-goals";

describe("financial goals API adapters", () => {
  it("unwraps the overview (single source for hero + grid)", async () => {
    const overview = { asOf: "2026-07-22", summary: {}, nextDeadline: null, goals: [] };
    vi.mocked(getFinancialGoalsOverview).mockResolvedValue({ status: 200, data: overview } as never);

    await expect(getFinancialGoalsOverviewData()).resolves.toBe(overview);
  });

  it("unwraps goal creation as 201", async () => {
    const goal = { id: "goal-1" };
    vi.mocked(createFinancialGoal).mockResolvedValue({ status: 201, data: goal } as never);

    await expect(
      createFinancialGoalData({ name: "Reserva", targetAmount: "10000.00" }),
    ).resolves.toBe(goal);
  });

  it("unwraps the idempotent cancel (DELETE) as 200", async () => {
    vi.mocked(cancelFinancialGoal).mockResolvedValue({
      status: 200,
      data: { canceled: true },
    } as never);

    await expect(cancelFinancialGoalData("goal-1")).resolves.toEqual({ canceled: true });
  });

  it("lists contributions of a goal and creates one as 201", async () => {
    const contributions = [{ id: "contribution-1" }];
    vi.mocked(listGoalContributions).mockResolvedValue({ status: 200, data: contributions } as never);
    vi.mocked(createGoalContribution).mockResolvedValue({
      status: 201,
      data: contributions[0],
    } as never);

    await expect(listGoalContributionsData("goal-1")).resolves.toBe(contributions);
    expect(listGoalContributions).toHaveBeenCalledWith("goal-1", undefined);

    await expect(
      createGoalContributionData("goal-1", { type: "contribution", amount: "100.00" }),
    ).resolves.toBe(contributions[0]);
  });

  it("keeps status failures as ApiError with the API message", async () => {
    vi.mocked(createGoalContribution).mockResolvedValue({
      status: 400,
      data: { message: "Withdrawal would make historical goal balance negative" },
    } as never);

    await expect(
      createGoalContributionData("goal-1", { type: "withdrawal", amount: "999.00" }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Withdrawal would make historical goal balance negative",
    });
  });
});
