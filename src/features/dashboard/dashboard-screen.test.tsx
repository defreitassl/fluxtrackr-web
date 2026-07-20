import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/dashboard/queries/use-dashboard-overview", () => ({
  useDashboardOverview: vi.fn(),
}));

import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";

const dashboardOverview = {
  asOf: "2026-07-16T12:00:00.000Z",
  balance: { total: "100.00", committed: "20.00", availableToSpend: "80.00" },
  dailySpending: {
    recommended: "10.00",
    spentToday: "5.00",
    remainingToday: "5.00",
    daysRemainingInMonth: 10,
    status: "within_plan" as const,
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

function mockDashboard(overrides: Record<string, unknown> = {}) {
  const refetch = vi.fn();
  vi.mocked(useDashboardOverview).mockReturnValue({
    data: dashboardOverview,
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch,
    ...overrides,
  } as never);
  return refetch;
}

describe("DashboardScreen", () => {
  it("keeps previous dashboard data visible after a refetch error and clears the alert on success", () => {
    const refetch = mockDashboard({ isError: true, isRefetchError: true });
    const { rerender } = render(<DashboardScreen />);

    expect(screen.getByText("Saldo total")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledWith({ cancelRefetch: false });

    mockDashboard();
    rerender(<DashboardScreen />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
