import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/recurrences/queries/use-recurrences", () => ({
  useSubscriptions: vi.fn(),
  useSubscriptionsSummary: vi.fn(),
  useFixedExpenses: vi.fn(),
  useFixedIncomes: vi.fn(),
  useRecurrencesRail: vi.fn(),
}));

vi.mock("@/features/dashboard/queries/use-credit-cards", () => ({
  useCreditCards: vi.fn().mockReturnValue({ data: [], isPending: false }),
}));

vi.mock("@/features/transactions/api/transactions", () => ({
  listTransactionAccountsData: vi.fn().mockResolvedValue([]),
  listTransactionCategoriesData: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/transactions/queries/use-monthly-summary", () => ({
  useTransactionMonthlySummary: vi.fn(),
}));

vi.mock("@/features/recurrences/mutations/use-recurrence-mutations", () => ({
  useArchiveFixedExpense: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useArchiveFixedIncome: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useArchiveSubscription: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useCancelFixedOccurrence: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useCancelSubscriptionCharge: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useCreateFixedExpense: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useCreateFixedIncome: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useCreateSubscription: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useRealizeFixedOccurrence: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useRealizeSubscriptionCharge: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateFixedExpense: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateFixedIncome: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateSubscription: vi.fn().mockReturnValue({ isPending: false, mutateAsync: vi.fn() }),
}));

import { RecurrencesScreen } from "@/features/recurrences/recurrences-screen";
import {
  useFixedExpenses,
  useFixedIncomes,
  useRecurrencesRail,
  useSubscriptions,
  useSubscriptionsSummary,
} from "@/features/recurrences/queries/use-recurrences";
import { useTransactionMonthlySummary } from "@/features/transactions/queries/use-monthly-summary";
import { SearchProvider } from "@/providers/search-provider";

const subscription = {
  id: "subscription-1",
  name: "Streaming",
  amount: "39.90",
  nextChargeDate: "2026-08-10T00:00:00.000Z",
  recurrence: "monthly",
  categoryId: null,
  accountId: "account-1",
  creditCardId: null,
  paymentMethod: "pix",
  autoRenew: true,
  isActive: true,
};

const fixedExpense = {
  id: "fixed-expense-1",
  name: "Internet",
  amount: "120.00",
  dueDay: 10,
  categoryId: null,
  accountId: "account-1",
  paymentMethod: "pix",
  isActive: true,
};

const fixedIncome = {
  id: "fixed-income-1",
  name: "Salário",
  amount: "5000.00",
  receiveDay: 5,
  categoryId: null,
  accountId: "account-1",
  paymentMethod: "pix",
  isActive: true,
};

function query(data: unknown) {
  return { data, isError: false, isPending: false, refetch: vi.fn() } as never;
}

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><SearchProvider>{children}</SearchProvider></QueryClientProvider>;
}

function mockScreenData({ incomes = [fixedIncome] }: { incomes?: unknown[] } = {}) {
  vi.mocked(useSubscriptions).mockReturnValue(query([subscription]));
  vi.mocked(useFixedExpenses).mockReturnValue(query([fixedExpense]));
  vi.mocked(useFixedIncomes).mockReturnValue(query(incomes));
  vi.mocked(useSubscriptionsSummary).mockReturnValue(query({ activeSubscriptions: 1, monthlyEquivalent: "39.90", pendingThisMonth: "39.90", nextCharge: null }));
  vi.mocked(useTransactionMonthlySummary).mockReturnValue(query({ fixedExpenseTotal: 120, fixedIncomeTotal: 5000 }));
  vi.mocked(useRecurrencesRail).mockReturnValue({
    isError: false,
    isPending: false,
    items: [
      { id: "occurrence-1", source: "fixed", templateId: "fixed-expense-1", type: "expense", name: "Internet", amount: "120.00", date: "2026-08-03T00:00:00.000Z", categoryId: null, accountId: "account-1", creditCardId: null, paymentMethod: "pix", raw: {} },
      { id: "charge-1", source: "subscription", templateId: "subscription-1", type: "expense", name: "Streaming", amount: "39.90", date: "2026-08-10T00:00:00.000Z", categoryId: null, accountId: "account-1", creditCardId: null, paymentMethod: "pix", raw: {} },
    ],
    refetch: vi.fn(),
  } as never);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RecurrencesScreen", () => {
  it("switches tabs and renders empty state for the selected tab", () => {
    mockScreenData({ incomes: [] });
    render(<RecurrencesScreen />, { wrapper });

    expect(screen.getAllByText("Streaming").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: "Gastos fixos" }));
    expect(screen.getAllByText("Internet").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: "Rendas fixas" }));
    expect(screen.getByText("Nenhuma renda fixa cadastrada")).toBeInTheDocument();
  });

  it("keeps the pending rail ordered and opens its realization dialog", () => {
    mockScreenData();
    render(<RecurrencesScreen />, { wrapper });

    const rail = screen.getByLabelText("Próximas cobranças");
    expect(within(rail).getAllByText(/Internet|Streaming/).map((node) => node.textContent)).toEqual(["Internet", "Streaming"]);
    fireEvent.click(within(rail).getAllByRole("button", { name: "Realizar" })[0]);
    expect(screen.getByRole("dialog", { name: "Realizar Internet" })).toBeInTheDocument();
  });

  it("opens a drawer from the contextual recurrence event", () => {
    mockScreenData();
    render(<RecurrencesScreen />, { wrapper });

    fireEvent(window, new Event("fluxtrackr:new-recurrence"));

    expect(screen.getByRole("dialog", { name: "Nova assinatura" })).toBeInTheDocument();
  });
});
