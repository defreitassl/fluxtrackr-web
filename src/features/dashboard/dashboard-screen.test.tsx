import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/dashboard/queries/use-dashboard-overview", () => ({
  useDashboardOverview: vi.fn(),
}));

vi.mock("@/features/dashboard/queries/use-balance-forecast", () => ({
  useBalanceForecast: vi.fn().mockReturnValue({ data: undefined }),
}));

vi.mock("@/features/dashboard/queries/use-dashboard-timeline", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/dashboard/queries/use-dashboard-timeline")>()),
  useDashboardTimeline: vi.fn().mockReturnValue({ data: undefined }),
}));

vi.mock("@/features/dashboard/queries/use-credit-cards", () => ({
  useCreditCards: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock("@/features/transactions/queries/use-transactions", () => ({
  useTransactions: vi.fn().mockReturnValue({ data: [], isPending: false }),
}));

vi.mock("@/features/transactions/queries/use-monthly-summary", () => ({
  useTransactionMonthlySummary: vi.fn().mockReturnValue({ data: undefined }),
}));

vi.mock("@/features/transactions/api/transactions", () => ({
  listTransactionAccountsData: vi.fn().mockResolvedValue([]),
  listTransactionCategoriesData: vi.fn().mockResolvedValue([]),
}));

import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  );
}

const overview = {
  asOf: "2026-07-15T18:00:00.000Z",
  balance: {
    total: "4800.00",
    committed: "2650.00",
    availableToSpend: "2150.00",
    committedBreakdown: {
      creditCardInvoices: "1280.00",
      fixedExpenses: "769.90",
      financialEvents: "560.20",
      subscriptions: "39.90",
    },
  },
  dailySpending: {
    recommended: "71.67",
    spentToday: "0.00",
    remainingToday: "71.67",
    daysRemainingInMonth: 17,
    status: "within_plan",
  },
  forecast30Days: {
    projectedFinalBalance: "6940.00",
    minimumProjectedBalance: "1200.00",
    firstNegativeDate: null,
  },
  budgetSummary: {
    totalLimit: "0.00",
    totalSpent: "0.00",
    totalRemaining: "0.00",
    nearLimitCount: 0,
    exceededCount: 0,
  },
  nextInvoice: {
    id: "invoice-1",
    creditCardId: "card-1",
    creditCardName: "Nubank Visa 4821",
    dueDate: "2026-07-18T00:00:00.000Z",
    status: "open",
    amount: "1280.00",
    installmentsCount: 4,
  },
  upcomingCommitments: [
    {
      id: "commitment-1",
      sourceType: "fixed_expense",
      sourceId: "fixed-1",
      type: "expense",
      title: "Academia",
      amount: "89.90",
      date: "2026-07-17T00:00:00.000Z",
      status: "pending",
      categoryId: null,
      accountId: null,
    },
  ],
  latestTransactions: [],
  latestMovements: [],
} as never;

function mockOverview(state: Record<string, unknown>) {
  vi.mocked(useDashboardOverview).mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch: vi.fn(),
    ...state,
  } as never);
}

describe("DashboardScreen", () => {
  it("shows the skeleton while the overview is pending", () => {
    mockOverview({ isPending: true });

    render(<DashboardScreen />, { wrapper });

    expect(screen.getByRole("status", { name: "Carregando Dashboard" })).toBeInTheDocument();
  });

  it("shows an error state when the overview fails without cached data", () => {
    mockOverview({ isError: true });

    render(<DashboardScreen />, { wrapper });

    expect(screen.getByText("Dashboard indisponível")).toBeInTheDocument();
  });

  it("renders hero, KPIs and side cards from the overview", () => {
    mockOverview({ data: overview });

    render(<DashboardScreen />, { wrapper });

    expect(screen.getByText("Disponível para gastar")).toBeInTheDocument();
    expect(screen.getByText("Receitas")).toBeInTheDocument();
    expect(screen.getByText("Previsão 30d")).toBeInTheDocument();
    expect(screen.getByText("Meta hoje")).toBeInTheDocument();
    expect(screen.getByText("Evolução e previsão do saldo")).toBeInTheDocument();
    expect(screen.getByText("Movimentações")).toBeInTheDocument();
    expect(screen.getByText("Calendário financeiro")).toBeInTheDocument();
    expect(screen.getByText("Nubank Visa 4821")).toBeInTheDocument();
    expect(screen.getByText("Academia")).toBeInTheDocument();
  });

  it("alerts when a refetch fails but keeps showing cached data", () => {
    mockOverview({ data: overview, isRefetchError: true });

    render(<DashboardScreen />, { wrapper });

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar");
    expect(screen.getByText("Disponível para gastar")).toBeInTheDocument();
  });
});
