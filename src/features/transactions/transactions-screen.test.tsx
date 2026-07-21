import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/transactions/queries/use-transactions", () => ({
  useTransactions: vi.fn(),
}));

vi.mock("@/features/transactions/api/transactions", () => ({
  listTransactionAccountsData: vi.fn().mockResolvedValue([]),
  listTransactionCategoriesData: vi.fn().mockResolvedValue([]),
  createTransactionData: vi.fn(),
  updateTransactionData: vi.fn(),
  deleteTransactionData: vi.fn(),
  createFixedExpenseData: vi.fn(),
  createFixedIncomeData: vi.fn(),
}));

vi.mock("@/features/dashboard/queries/use-credit-cards", () => ({
  useCreditCards: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock("@/features/wallet/transfers/mutations/use-create-account-transfer", () => ({
  useCreateAccountTransfer: vi.fn().mockReturnValue({ isPending: false, mutate: vi.fn() }),
}));

vi.mock("@/features/wallet/credit-cards/mutations/use-create-credit-card-purchase", () => ({
  useCreateCreditCardPurchase: vi.fn().mockReturnValue({ isPending: false, mutate: vi.fn() }),
}));

import { TransactionsScreen } from "@/features/transactions/transactions-screen";
import { useTransactions } from "@/features/transactions/queries/use-transactions";
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

const makeTransaction = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "transaction-1",
    userId: "user-1",
    type: "expense",
    amount: "142.70",
    description: "Supermercado",
    categoryId: null,
    accountId: null,
    paymentMethod: "debit",
    occurredAt: "2026-07-15T12:00:00.000Z",
    source: "app",
    createdAt: "2026-07-15T12:00:00.000Z",
    updatedAt: "2026-07-15T12:00:00.000Z",
    ...overrides,
  }) as never;

function mockTransactions(state: Record<string, unknown>) {
  vi.mocked(useTransactions).mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch: vi.fn(),
    ...state,
  } as never);
}

describe("TransactionsScreen", () => {
  it("shows the shimmer list while pending", () => {
    mockTransactions({ isPending: true });

    render(<TransactionsScreen />, { wrapper });

    expect(screen.getByRole("status", { name: "Carregando movimentações" })).toBeInTheDocument();
  });

  it("shows the wireframe error state when loading fails", () => {
    mockTransactions({ isError: true });

    render(<TransactionsScreen />, { wrapper });

    expect(screen.getByText("Falha ao carregar movimentações")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("shows the empty state with a create CTA when there are no rows", () => {
    mockTransactions({ data: [] });

    render(<TransactionsScreen />, { wrapper });

    expect(screen.getByText("Nenhuma movimentação neste período")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nova movimentação/ })).toBeInTheDocument();
  });

  it("renders summary tiles computed from the listed transactions", () => {
    mockTransactions({
      data: [
        makeTransaction({ id: "t1", type: "income", amount: "3700.00", description: "Salário" }),
        makeTransaction({ id: "t2", type: "expense", amount: "1550.00", description: "Aluguel" }),
      ],
    });

    render(<TransactionsScreen />, { wrapper });

    expect(screen.getByText("Entradas no período")).toBeInTheDocument();
    expect(screen.getAllByText(/3\.700,00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1\.550,00/).length).toBeGreaterThan(0);
    expect(screen.getByText("Resultado")).toBeInTheDocument();
    expect(screen.getByText(/\+\s*R\$\s*2\.150,00/)).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1–2 de 2 movimentações")).toBeInTheDocument();
  });

  it("shows the bulk bar when rows are selected", () => {
    mockTransactions({
      data: [
        makeTransaction({ id: "t1", description: "Supermercado" }),
        makeTransaction({ id: "t2", description: "Uber", amount: "18.50" }),
      ],
    });

    render(<TransactionsScreen />, { wrapper });

    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar Supermercado" }));
    expect(screen.getByText("1 selecionada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recategorizar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar Uber" }));
    expect(screen.getByText("2 selecionadas")).toBeInTheDocument();
  });

  it("opens the edit drawer when a row is clicked", () => {
    mockTransactions({ data: [makeTransaction()] });

    render(<TransactionsScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Editar Supermercado" }));

    expect(screen.getByRole("dialog", { name: "Editar movimentação" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Supermercado")).toBeInTheDocument();
    expect(screen.getByDisplayValue("142.70")).toBeInTheDocument();
  });

  it("opens the creation drawer with the four movement tabs on the global event", () => {
    mockTransactions({ data: [] });

    render(<TransactionsScreen />, { wrapper });

    fireEvent(window, new Event("fluxtrackr:new-transaction"));

    const drawer = screen.getByRole("dialog", { name: "Nova movimentação" });
    const tabs = within(drawer).getByRole("group", { name: "Tipo de movimentação" });
    expect(within(tabs).getByRole("button", { name: "Despesa" })).toBeInTheDocument();
    expect(within(tabs).getByRole("button", { name: "Receita" })).toBeInTheDocument();
    expect(within(tabs).getByRole("button", { name: "Transferência" })).toBeInTheDocument();
    expect(within(tabs).getByRole("button", { name: "Compra no cartão" })).toBeInTheDocument();
  });
});
