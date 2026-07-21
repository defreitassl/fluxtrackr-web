import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/planning/queries/use-category-budget-overview", () => ({
  useCategoryBudgetOverview: vi.fn(),
}));
vi.mock("@/features/planning/queries/use-planning-categories", () => ({
  usePlanningCategories: vi.fn(),
}));

import { PlanningScreen } from "@/features/planning/planning-screen";
import { useCategoryBudgetOverview } from "@/features/planning/queries/use-category-budget-overview";
import { usePlanningCategories } from "@/features/planning/queries/use-planning-categories";

afterEach(cleanup);

const overview = {
  year: 2026,
  month: 7,
  asOf: "2026-07-20T12:00:00.000Z",
  summary: {
    totalLimit: "1100.00",
    totalSpent: "1030.00",
    totalRemaining: "70.00",
    nearLimitCount: 1,
    exceededCount: 1,
  },
  budgets: [
    {
      id: "budget-market",
      category: { id: "market", name: "Mercado", type: "expense" },
      limitAmount: "600.00",
      warningPercentage: 80,
      transactionSpent: "510.00",
      creditCardSpent: "0.00",
      spentAmount: "510.00",
      remainingAmount: "90.00",
      usagePercentage: "85.00",
      status: "near_limit",
    },
    {
      id: "budget-trip",
      category: { id: "trip", name: "Viagem", type: "expense" },
      limitAmount: "500.00",
      warningPercentage: 80,
      transactionSpent: "520.00",
      creditCardSpent: "0.00",
      spentAmount: "520.00",
      remainingAmount: "-20.00",
      usagePercentage: "104.00",
      status: "exceeded",
    },
  ],
};

const categories = [
  { id: "market", name: "Mercado", type: "expense", isActive: true },
  { id: "trip", name: "Viagem", type: "expense", isActive: true },
  { id: "income", name: "Salário", type: "income", isActive: true },
];

function mockQueries(
  overviewOverrides: Record<string, unknown> = {},
  categoryOverrides: Record<string, unknown> = {},
) {
  const refetchOverview = vi.fn();
  const refetchCategories = vi.fn();

  vi.mocked(useCategoryBudgetOverview).mockReturnValue({
    data: overview,
    isError: false,
    isFetching: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    refetch: refetchOverview,
    ...overviewOverrides,
  } as never);
  vi.mocked(usePlanningCategories).mockReturnValue({
    data: categories,
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch: refetchCategories,
    ...categoryOverrides,
  } as never);

  return { refetchOverview, refetchCategories };
}

describe("PlanningScreen", () => {
  it("shows API overview fields and filters by returned status", () => {
    mockQueries();
    render(<PlanningScreen />);

    expect(screen.getByRole("heading", { level: 1, name: "Planejamento" })).toBeInTheDocument();
    expect(screen.getByText("Total orçado")).toBeInTheDocument();
    expect(screen.getAllByText("Em atenção")).toHaveLength(2);
    expect(screen.getByText("Limite ultrapassado")).toBeInTheDocument();
    expect(screen.getByText("104%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ultrapassados/ }));

    expect(screen.queryByRole("heading", { level: 3, name: "Mercado" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Viagem" })).toBeInTheDocument();
  });

  it("keeps current data visible after a refetch error and retries both sources", () => {
    const { refetchCategories, refetchOverview } = mockQueries({ isError: true, isRefetchError: true });
    render(<PlanningScreen />);

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar os orçamentos");
    expect(screen.getByText("Total gasto")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(refetchOverview).toHaveBeenCalledWith({ cancelRefetch: false });
    expect(refetchCategories).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it("renders the initial loading state without stale planning data", () => {
    mockQueries({ data: undefined, isPending: true }, { data: undefined, isPending: true });
    render(<PlanningScreen />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando planejamento mensal");
    expect(screen.queryByText("Total orçado")).not.toBeInTheDocument();
  });
});
