import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  getDashboardOverview: vi.fn(),
}));

import { getDashboardOverview } from "@/api/generated/client";
import { getDashboardOverviewData } from "@/features/dashboard/api/get-dashboard-overview";
import { ApiError } from "@/lib/http";

const dashboardOverview = {
  asOf: "2026-07-16T12:00:00.000Z",
  balance: { total: "100.00", committed: "20.00", availableToSpend: "80.00" },
  dailySpending: {
    recommended: "10.00",
    spentToday: "5.00",
    remainingToday: "5.00",
    daysRemainingInMonth: 10,
    status: "within_plan",
  },
  forecast30Days: {
    projectedFinalBalance: "120.00",
    minimumProjectedBalance: "80.00",
    firstNegativeDate: null,
  },
  budgetSummary: {
    totalLimit: "50.00",
    totalSpent: "20.00",
    totalRemaining: "30.00",
    nearLimitCount: 0,
    exceededCount: 0,
  },
  nextInvoice: null,
  upcomingCommitments: [],
  latestTransactions: [],
  latestMovements: [],
};

describe("getDashboardOverviewData", () => {
  it("returns only DashboardOverview from Orval response envelope", async () => {
    vi.mocked(getDashboardOverview).mockResolvedValue({
      data: dashboardOverview,
      status: 200,
      headers: new Headers(),
    } as never);

    await expect(getDashboardOverviewData()).resolves.toBe(dashboardOverview);
  });

  it("preserves ApiError from HTTP client", async () => {
    const error = new ApiError(503, { message: "Serviço indisponível." });
    vi.mocked(getDashboardOverview).mockRejectedValueOnce(error);

    await expect(getDashboardOverviewData()).rejects.toBe(error);
  });
});
