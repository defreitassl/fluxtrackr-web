import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/timeline/queries/use-financial-timeline", () => ({
  useFinancialTimeline: vi.fn(),
}));

vi.mock("@/features/dashboard/queries/use-balance-forecast", () => ({
  useBalanceForecast: vi.fn().mockReturnValue({ data: undefined }),
}));

vi.mock("@/features/transactions/api/transactions", () => ({
  listTransactionAccountsData: vi.fn().mockResolvedValue([]),
  listTransactionCategoriesData: vi.fn().mockResolvedValue([]),
}));

import { TimelineScreen } from "@/features/timeline/timeline-screen";
import { useBalanceForecast } from "@/features/dashboard/queries/use-balance-forecast";
import { useFinancialTimeline } from "@/features/timeline/queries/use-financial-timeline";

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

function futureDateIso(daysAhead: number) {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
}

const makeItem = (overrides: Record<string, unknown>) => ({
  id: "item-1",
  sourceType: "transaction",
  sourceId: "source-1",
  type: "expense",
  title: "Item",
  amount: "100.00",
  date: new Date().toISOString(),
  status: "realized",
  balanceImpact: "realized",
  accountId: null,
  creditCardId: null,
  categoryId: null,
  metadata: {},
  ...overrides,
});

function mockTimeline(state: Record<string, unknown>) {
  vi.mocked(useFinancialTimeline).mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch: vi.fn(),
    ...state,
  } as never);
}

describe("TimelineScreen", () => {
  it("shows the shimmer skeleton while pending", () => {
    mockTimeline({ isPending: true });

    render(<TimelineScreen />, { wrapper });

    expect(screen.getByRole("status", { name: "Carregando Timeline" })).toBeInTheDocument();
  });

  it("shows the wireframe error state when loading fails without data", () => {
    mockTimeline({ isError: true });

    render(<TimelineScreen />, { wrapper });

    expect(screen.getByText("Falha ao carregar a timeline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("renders the calendar view with legend and projection rail", () => {
    mockTimeline({
      data: {
        startDate: "",
        endDate: "",
        items: [makeItem({ title: "Supermercado" })],
        summary: { realizedIncome: "0", realizedExpense: "0", projectedIncome: "0", projectedExpense: "0" },
      },
    });
    vi.mocked(useBalanceForecast).mockReturnValue({
      data: { currentBalance: "4870.10", projectedFinalBalance: "1849.90", points: [] },
    } as never);

    render(<TimelineScreen />, { wrapper });

    expect(screen.getByText("Fatura / dívida")).toBeInTheDocument();
    expect(screen.getByText("Saldo projetado")).toBeInTheDocument();
    expect(screen.getByText("Disponível hoje")).toBeInTheDocument();
    expect(screen.getByText(/4\.870,10/)).toBeInTheDocument();
    expect(screen.getByText("Próximos compromissos")).toBeInTheDocument();
  });

  it("switches to the track view and shows the empty state without events", () => {
    mockTimeline({
      data: {
        startDate: "",
        endDate: "",
        items: [],
        summary: { realizedIncome: "0", realizedExpense: "0", projectedIncome: "0", projectedExpense: "0" },
      },
    });

    render(<TimelineScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Linha do tempo/ }));

    expect(screen.getByText("Nenhum evento neste período")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nova movimentação/ })).toBeInTheDocument();
  });

  it("shows the invoice alert card when a projected invoice is upcoming", () => {
    mockTimeline({
      data: {
        startDate: "",
        endDate: "",
        items: [
          makeItem({
            id: "invoice-1",
            sourceType: "credit_card_invoice",
            balanceImpact: "projected",
            title: "Fatura Nubank - 07/2026",
            amount: "1240.50",
            date: futureDateIso(10),
            metadata: { creditCard: { id: "cc-1", name: "Nubank" } },
          }),
        ],
        summary: { realizedIncome: "0", realizedExpense: "0", projectedIncome: "0", projectedExpense: "0" },
      },
    });

    render(<TimelineScreen />, { wrapper });

    expect(screen.getByText(/Fatura Nubank vence em/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pagar fatura" })).toBeInTheDocument();
  });

  it("hides projected items when the forecast switch is turned off", () => {
    mockTimeline({
      data: {
        startDate: "",
        endDate: "",
        items: [
          makeItem({ id: "past", title: "Compra realizada" }),
          makeItem({
            id: "future",
            title: "Aluguel previsto",
            balanceImpact: "projected",
            sourceType: "fixed_expense",
            date: futureDateIso(3),
          }),
        ],
        summary: { realizedIncome: "0", realizedExpense: "0", projectedIncome: "0", projectedExpense: "0" },
      },
    });

    render(<TimelineScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Linha do tempo/ }));
    // aparece na trilha e no card "Próximos compromissos" da coluna lateral
    expect(screen.getAllByText("Aluguel previsto")).toHaveLength(2);

    fireEvent.click(screen.getByRole("switch", { name: "Mostrar previsão" }));
    // some da trilha, mas a coluna lateral continua listando o compromisso
    expect(screen.getAllByText("Aluguel previsto")).toHaveLength(1);
    expect(screen.getByText("Compra realizada")).toBeInTheDocument();
  });
});
