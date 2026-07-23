import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/goals/queries/use-financial-goals", () => ({
  useFinancialGoalsOverview: vi.fn(),
  useGoalContributions: vi.fn().mockReturnValue({ data: [], isPending: false, isError: false }),
}));

vi.mock("@/features/goals/mutations/use-goal-mutations", () => {
  const mutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
  return {
    useCreateFinancialGoal: vi.fn(mutation),
    useUpdateFinancialGoal: vi.fn(mutation),
    useCancelFinancialGoal: vi.fn(mutation),
    useCreateGoalContribution: vi.fn(mutation),
  };
});

import type { FinancialGoal } from "@/api/generated/client";
import { GoalsScreen } from "@/features/goals/goals-screen";
import { useCreateGoalContribution } from "@/features/goals/mutations/use-goal-mutations";
import {
  useFinancialGoalsOverview,
  useGoalContributions,
} from "@/features/goals/queries/use-financial-goals";
import { ApiError } from "@/lib/http";
import { SearchProvider } from "@/providers/search-provider";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(useGoalContributions).mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
  } as never);
});

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SearchProvider>{children}</SearchProvider>
    </QueryClientProvider>
  );
}

const makeGoal = (overrides: Partial<FinancialGoal> = {}): FinancialGoal => ({
  id: "goal-1",
  name: "Reserva de emergência",
  description: null,
  targetAmount: "10000.00",
  currentAmount: "2500.00",
  remainingAmount: "7500.00",
  progressPercentage: "25.00",
  targetDate: "2027-01-31T00:00:00.000Z",
  status: "active",
  completedAt: null,
  canceledAt: null,
  isOverdue: false,
  daysRemaining: 193,
  monthsRemaining: 7,
  requiredMonthlyContribution: "1071.43",
  ...overrides,
});

const overview = {
  asOf: "2026-07-22T12:00:00.000Z",
  summary: {
    activeGoals: 2,
    completedGoals: 1,
    canceledGoals: 1,
    totalTargetAmount: "30000.00",
    totalCurrentAmount: "13700.00",
    totalRemainingAmount: "16300.00",
    averageProgressPercentage: "45.67",
    overdueGoals: 1,
  },
  nextDeadline: {
    id: "goal-1",
    name: "Reserva de emergência",
    targetDate: "2027-01-31T00:00:00.000Z",
    currentAmount: "2500.00",
    remainingAmount: "7500.00",
  },
  goals: [
    makeGoal(),
    makeGoal({
      id: "goal-2",
      name: "Viagem ao Japão",
      currentAmount: "11200.00",
      remainingAmount: "0.00",
      progressPercentage: "112.00",
    }),
    makeGoal({ id: "goal-3", name: "Meta antiga", status: "canceled" }),
  ],
};

function mockOverview(state: Record<string, unknown>) {
  vi.mocked(useFinancialGoalsOverview).mockReturnValue({
    data: undefined,
    isError: false,
    isPending: false,
    isRefetchError: false,
    refetch: vi.fn(),
    ...state,
  } as never);
}

describe("GoalsScreen", () => {
  it("shows the skeleton while loading", () => {
    mockOverview({ isPending: true });

    render(<GoalsScreen />, { wrapper });

    expect(screen.getByRole("status", { name: "Carregando metas" })).toBeInTheDocument();
  });

  it("renders hero and cards from the overview and clamps the progress bar at 100%", () => {
    mockOverview({ data: overview });

    render(<GoalsScreen />, { wrapper });

    expect(screen.getByText("2 ativas")).toBeInTheDocument();
    expect(screen.getByText("1 concluída")).toBeInTheDocument();
    expect(screen.getByText("1 atrasada")).toBeInTheDocument();

    const overGoal = screen.getByRole("article", { name: "Viagem ao Japão" });
    expect(within(overGoal).getByText("112%")).toBeInTheDocument();
    const bar = within(overGoal).getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(within(overGoal).getByTestId("goal-progress-goal-2")).toHaveStyle({ width: "100%" });
  });

  it("filters by status and offers reactivation for canceled goals", () => {
    mockOverview({ data: overview });

    render(<GoalsScreen />, { wrapper });

    expect(screen.queryByRole("article", { name: "Meta antiga" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Canceladas" }));

    const card = screen.getByRole("article", { name: "Meta antiga" });
    expect(within(card).getByRole("button", { name: "Reativar" })).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: "Aporte / Resgate" })).not.toBeInTheDocument();
  });

  it("shows the contribution history inside the drawer", () => {
    mockOverview({ data: overview });
    vi.mocked(useGoalContributions).mockReturnValue({
      data: [
        {
          id: "contribution-1",
          userId: "user-1",
          goalId: "goal-1",
          type: "contribution",
          amount: "2500.00",
          note: "Primeiro aporte",
          occurredAt: "2026-07-01T12:00:00.000Z",
          createdAt: "2026-07-01T12:00:00.000Z",
        },
      ],
      isPending: false,
      isError: false,
    } as never);

    render(<GoalsScreen />, { wrapper });

    const card = screen.getByRole("article", { name: "Reserva de emergência" });
    fireEvent.click(within(card).getByRole("button", { name: "Aporte / Resgate" }));

    const drawer = screen.getByRole("dialog", { name: "Aporte ou resgate da meta" });
    expect(within(drawer).getByText(/Primeiro aporte/)).toBeInTheDocument();
    expect(
      within(drawer).getByText("Aportes não movimentam suas contas — este é um controle separado."),
    ).toBeInTheDocument();
  });

  it("surfaces the API message when a withdrawal would go negative", () => {
    mockOverview({ data: overview });
    vi.mocked(useCreateGoalContribution).mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
      mutate: vi.fn((_, options?: { onError?: (error: ApiError) => void }) =>
        options?.onError?.(
          new ApiError(400, { message: "Withdrawal would make historical goal balance negative" }),
        ),
      ),
    } as never);

    render(<GoalsScreen />, { wrapper });

    const card = screen.getByRole("article", { name: "Reserva de emergência" });
    fireEvent.click(within(card).getByRole("button", { name: "Aporte / Resgate" }));

    const drawer = screen.getByRole("dialog", { name: "Aporte ou resgate da meta" });
    fireEvent.click(within(drawer).getByRole("button", { name: "Resgate" }));
    fireEvent.change(within(drawer).getByLabelText("Valor"), { target: { value: "9999" } });
    fireEvent.click(within(drawer).getByRole("button", { name: "Registrar resgate" }));

    expect(
      within(drawer).getByText(
        "Este resgate deixaria o histórico da meta negativo. Reduza o valor do resgate.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the empty state with a create CTA", () => {
    mockOverview({ data: { ...overview, goals: [] } });

    render(<GoalsScreen />, { wrapper });

    expect(screen.getByText("Nenhuma meta criada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nova meta/ })).toBeInTheDocument();
  });

  it("opens the creation drawer via the global header CTA", () => {
    mockOverview({ data: overview });

    render(<GoalsScreen />, { wrapper });

    fireEvent(window, new Event("fluxtrackr:new-goal"));

    expect(screen.getByRole("dialog", { name: "Nova meta" })).toBeInTheDocument();
  });
});
