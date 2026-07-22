import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/planning/queries/use-category-budget-overview", () => ({
  useCategoryBudgetOverview: vi.fn(),
}));

vi.mock("@/features/planning/queries/use-planning-categories", () => ({
  usePlanningCategories: vi.fn().mockReturnValue({ data: [], isError: false, isPending: false }),
}));

vi.mock("@/features/planning/mutations/use-category-budget-mutations", () => ({
  useCreateCategoryBudget: vi.fn().mockReturnValue({ isPending: false, mutate: vi.fn() }),
  useUpdateCategoryBudget: vi.fn().mockReturnValue({ isPending: false, mutate: vi.fn() }),
  useArchiveCategoryBudget: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
}));

import { PlanningScreen } from "@/features/planning/planning-screen";
import { useCategoryBudgetOverview } from "@/features/planning/queries/use-category-budget-overview";
import { SearchProvider } from "@/providers/search-provider";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SearchProvider>{children}</SearchProvider>
    </QueryClientProvider>
  );
}

const makeBudget = (overrides: Record<string, unknown> = {}) => ({
  id: "budget-1",
  category: { id: "category-1", name: "Alimentação", type: "expense" },
  limitAmount: "800.00",
  warningPercentage: 80,
  transactionSpent: "700.00",
  creditCardSpent: "20.00",
  spentAmount: "720.00",
  remainingAmount: "80.00",
  usagePercentage: "90.00",
  status: "near_limit",
  ...overrides,
});

const overview = {
  year: 2026,
  month: 7,
  asOf: "2026-07-22T12:00:00.000Z",
  summary: {
    totalLimit: "3650.00",
    totalSpent: "2825.00",
    totalRemaining: "825.00",
    nearLimitCount: 2,
    exceededCount: 1,
  },
  budgets: [
    makeBudget(),
    makeBudget({
      id: "budget-2",
      category: { id: "category-2", name: "Lazer", type: "expense" },
      limitAmount: "300.00",
      spentAmount: "340.00",
      remainingAmount: "-40.00",
      usagePercentage: "113.33",
      status: "exceeded",
    }),
  ],
};

function mockOverview(state: Record<string, unknown>) {
  vi.mocked(useCategoryBudgetOverview).mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch: vi.fn(),
    ...state,
  } as never);
}

describe("PlanningScreen", () => {
  it("shows the shimmer skeleton while pending", () => {
    mockOverview({ isPending: true });

    render(<PlanningScreen />, { wrapper });

    expect(screen.getByRole("status", { name: "Carregando orçamentos" })).toBeInTheDocument();
  });

  it("shows the wireframe error state on failure", () => {
    mockOverview({ isError: true });

    render(<PlanningScreen />, { wrapper });

    expect(screen.getByText("Falha ao carregar orçamentos")).toBeInTheDocument();
  });

  it("renders the hero, status chips and budget cards", () => {
    mockOverview({ data: overview });

    render(<PlanningScreen />, { wrapper });

    expect(screen.getByText(/Orçamento de julho/)).toBeInTheDocument();
    expect(screen.getAllByText(/2\.825,00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/de R\$\s*3\.650,00 orçados/)).toBeInTheDocument();
    expect(screen.getByText("2 em atenção")).toBeInTheDocument();
    expect(screen.getByText("1 ultrapassado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar orçamento de Alimentação" })).toBeInTheDocument();
    expect(screen.getByText(/Ultrapassou/)).toBeInTheDocument();
    expect(screen.getByText("Lazer ultrapassou o limite")).toBeInTheDocument();
  });

  it("filters budgets by status chip", () => {
    mockOverview({ data: overview });

    render(<PlanningScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Ultrapassados/ }));

    expect(screen.queryByRole("button", { name: "Editar orçamento de Alimentação" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar orçamento de Lazer" })).toBeInTheDocument();
  });

  it("opens the budget drawer prefilled when a card is clicked", () => {
    mockOverview({ data: overview });

    render(<PlanningScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Editar orçamento de Alimentação" }));

    const drawer = screen.getByRole("dialog", { name: "Editar orçamento" });
    expect(within(drawer).getByDisplayValue("800.00")).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "80%" })).toHaveAttribute("aria-pressed", "true");
    expect(within(drawer).getByRole("button", { name: "Arquivar orçamento" })).toBeInTheDocument();
  });

  it("shows the empty state with a create CTA when there are no budgets", () => {
    mockOverview({ data: { ...overview, budgets: [] } });

    render(<PlanningScreen />, { wrapper });

    expect(screen.getByText("Nenhum orçamento definido")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Novo orçamento/ }).length).toBeGreaterThan(0);
  });
});
