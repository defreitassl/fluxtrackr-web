import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/transactions/api/transactions", () => ({
  listTransactionAccountsData: vi.fn().mockResolvedValue([]),
  listTransactionCategoriesData: vi.fn().mockResolvedValue([]),
  createTransactionData: vi.fn(),
  deleteTransactionData: vi.fn(),
  updateTransactionData: vi.fn(),
}));

vi.mock("@/features/transactions/queries/use-transactions", () => ({
  useTransactions: vi.fn(),
}));

vi.mock("@/features/transactions/queries/use-monthly-summary", () => ({
  useTransactionMonthlySummary: vi.fn(),
}));

import { TransactionsScreen } from "@/features/transactions/transactions-screen";
import {
  createTransactionData,
  deleteTransactionData,
  listTransactionAccountsData,
  listTransactionCategoriesData,
  updateTransactionData,
} from "@/features/transactions/api/transactions";
import { useTransactionMonthlySummary } from "@/features/transactions/queries/use-monthly-summary";
import { useTransactions } from "@/features/transactions/queries/use-transactions";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}

const makeTransaction = (overrides: Record<string, unknown> = {}) => ({
  id: "transaction-1",
  userId: "user-1",
  type: "expense",
  amount: "25.00",
  description: "Mercado",
  categoryId: "category-1",
  accountId: "account-1",
  paymentMethod: "pix",
  occurredAt: "2026-07-20T15:30:00.000Z",
  source: "app",
  createdAt: "2026-07-20T15:31:00.000Z",
  updatedAt: "2026-07-20T15:31:00.000Z",
  ...overrides,
}) as never;

const makeCategory = (overrides: Record<string, unknown> = {}) => ({
  id: "category-1",
  userId: "user-1",
  name: "Alimentação",
  type: "expense",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
}) as never;

const makeAccount = (overrides: Record<string, unknown> = {}) => ({
  id: "account-1",
  userId: "user-1",
  name: "Conta principal",
  bank: null,
  type: "checking",
  color: null,
  icon: null,
  initialBalance: "0.00",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
}) as never;

type ScreenMocks = {
  accounts?: unknown[];
  categories?: unknown[];
  summaryData?: unknown;
  summaryOverrides?: Record<string, unknown>;
  transactionData?: unknown;
  transactionOverrides?: Record<string, unknown>;
};

function mockScreenQueries({
  accounts = [],
  categories = [],
  summaryData = { transactionIncomeTotal: 0, transactionExpenseTotal: 0, availableBalance: 0 },
  summaryOverrides = {},
  transactionData = [],
  transactionOverrides = {},
}: ScreenMocks = {}) {
  const transactionsRefetch = vi.fn();
  const summaryRefetch = vi.fn();
  vi.mocked(useTransactions).mockReturnValue({
    data: transactionData,
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch: transactionsRefetch,
    ...transactionOverrides,
  } as never);
  vi.mocked(useTransactionMonthlySummary).mockReturnValue({
    data: summaryData,
    isError: false,
    isFetching: false,
    refetch: summaryRefetch,
    ...summaryOverrides,
  } as never);
  vi.mocked(listTransactionAccountsData).mockResolvedValue(accounts as never);
  vi.mocked(listTransactionCategoriesData).mockResolvedValue(categories as never);
  return { summaryRefetch, transactionsRefetch };
}

function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
  const result = render(<TransactionsScreen />, {
    wrapper: ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });

  return { ...result, invalidate };
}

function expectTransactionInvalidations(invalidate: ReturnType<typeof vi.fn>) {
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["transactions"] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["monthly-summary"] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
}

describe("TransactionsScreen", () => {
  it("does not enable the transaction query or manual refresh for an invalid range", async () => {
    mockScreenQueries();
    render(<TransactionsScreen />, { wrapper });

    fireEvent.change(screen.getByLabelText("Início (UTC)"), { target: { value: "2026-08-10" } });
    fireEvent.change(screen.getByLabelText("Fim (UTC)"), { target: { value: "2026-08-01" } });

    await waitFor(() => expect(vi.mocked(useTransactions).mock.calls.at(-1)).toEqual([null, { enabled: false }]));
    expect(screen.getByRole("alert")).toHaveTextContent("A data inicial deve ser anterior ou igual à data final.");
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeDisabled();
  });

  it("re-enables the transaction query once the range is corrected", async () => {
    mockScreenQueries();
    render(<TransactionsScreen />, { wrapper });

    fireEvent.change(screen.getByLabelText("Início (UTC)"), { target: { value: "2026-08-10" } });
    fireEvent.change(screen.getByLabelText("Fim (UTC)"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("Fim (UTC)"), { target: { value: "2026-08-12" } });

    await waitFor(() => expect(vi.mocked(useTransactions).mock.calls.at(-1)).toEqual([
      { startDate: "2026-08-10T00:00:00.000Z", endDate: "2026-08-12T23:59:59.999Z" },
      { enabled: true },
    ]));
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeEnabled();
  });

  it("covers initial loading, initial error and both empty states", () => {
    mockScreenQueries({
      transactionData: null,
      transactionOverrides: { isPending: true },
      summaryData: null,
      summaryOverrides: { isFetching: true },
    });
    const { rerender } = render(<TransactionsScreen />, { wrapper });

    expect(document.querySelector('[aria-label="Carregando transações"]')).toBeInTheDocument();
    expect(document.querySelector('[aria-label="Carregando resumo mensal"]')).toBeInTheDocument();

    mockScreenQueries({ transactionData: null, transactionOverrides: { isError: true } });
    rerender(<TransactionsScreen />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar suas transações agora.");

    mockScreenQueries();
    rerender(<TransactionsScreen />);
    expect(screen.getByText("Nenhuma transação foi registrada.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "expense" } });
    expect(screen.getByText("Nenhuma transação corresponde aos filtros selecionados.")).toBeInTheDocument();
  });

  it("sends all filters as UTC query params, follows the summary month and clears them", async () => {
    mockScreenQueries({
      categories: [makeCategory(), makeCategory({ id: "archived-category", isActive: false, name: "Arquivada" })],
      accounts: [makeAccount(), makeAccount({ id: "archived-account", isActive: false, name: "Conta antiga" })],
    });
    render(<TransactionsScreen />, { wrapper });

    await screen.findByRole("option", { name: "Alimentação" });
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "expense" } });
    fireEvent.change(screen.getByLabelText("Início (UTC)"), { target: { value: "2026-08-03" } });
    fireEvent.change(screen.getByLabelText("Fim (UTC)"), { target: { value: "2026-08-18" } });
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "category-1" } });
    fireEvent.change(screen.getByLabelText("Conta"), { target: { value: "account-1" } });
    fireEvent.change(screen.getByLabelText("Pagamento"), { target: { value: "credit" } });

    await waitFor(() => expect(vi.mocked(useTransactions).mock.calls.at(-1)).toEqual([
      {
        type: "expense",
        startDate: "2026-08-03T00:00:00.000Z",
        endDate: "2026-08-18T23:59:59.999Z",
        categoryId: "category-1",
        accountId: "account-1",
        paymentMethod: "credit",
      },
      { enabled: true },
    ]));
    expect(vi.mocked(useTransactionMonthlySummary).mock.calls.at(-1)).toEqual([{ year: 2026, month: 8 }, { enabled: true }]);
    expect(screen.queryByRole("option", { name: "Arquivada" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Conta antiga" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(vi.mocked(useTransactions).mock.calls.at(-1)).toEqual([{}, { enabled: true }]));
  });

  it("hides and does not request the monthly summary for a range that spans multiple months", async () => {
    mockScreenQueries();
    render(<TransactionsScreen />, { wrapper });

    fireEvent.change(screen.getByLabelText("Início (UTC)"), { target: { value: "2026-07-31" } });
    fireEvent.change(screen.getByLabelText("Fim (UTC)"), { target: { value: "2026-08-01" } });

    await waitFor(() => expect(vi.mocked(useTransactionMonthlySummary).mock.calls.at(-1)).toEqual([
      { year: 2026, month: 7 },
      { enabled: false },
    ]));
    expect(screen.getByRole("status")).toHaveTextContent("O resumo mensal está disponível para períodos dentro do mesmo mês.");
    expect(screen.queryByText("Receitas lançadas")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /julho de 2026/i })).not.toBeInTheDocument();
  });

  it("retries transactions and the monthly summary while preserving data after a refetch error", () => {
    const { summaryRefetch, transactionsRefetch } = mockScreenQueries({
      transactionData: [makeTransaction()],
      transactionOverrides: { isError: true, isRefetchError: true },
    });
    render(<TransactionsScreen />, { wrapper });

    expect(screen.getByText("Mercado")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Os dados exibidos podem estar desatualizados.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(transactionsRefetch).toHaveBeenCalledWith({ cancelRefetch: false });
    expect(summaryRefetch).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it("creates a transaction from the unified movement dialog and invalidates dependent views", async () => {
    mockScreenQueries({ categories: [makeCategory()], accounts: [makeAccount()] });
    vi.mocked(createTransactionData).mockResolvedValue(makeTransaction());
    const { invalidate } = renderScreen();

    fireEvent.click(screen.getByRole("button", { name: "Nova movimentação" }));
    expect(screen.getByRole("dialog", { name: "Nova movimentação" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Despesa/ }));

    expect(screen.getByRole("dialog", { name: "Nova transação" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Padaria" } });
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "12,50" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createTransactionData).toHaveBeenCalledWith(expect.objectContaining({
      type: "expense",
      amount: 12.5,
      description: "Padaria",
      source: "app",
    })));
    expectTransactionInvalidations(invalidate);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Transação criada com sucesso."));
  });

  it("edits a transaction with historical category/account options and preserves invalidations", async () => {
    const historicalCategory = makeCategory({ id: "old-category", isActive: false, name: "Categoria histórica" });
    const historicalAccount = makeAccount({ id: "old-account", isActive: false, name: "Conta histórica" });
    const transaction = makeTransaction({ categoryId: "old-category", accountId: "old-account", paymentMethod: "credit" });
    mockScreenQueries({ transactionData: [transaction], categories: [historicalCategory], accounts: [historicalAccount] });
    const { invalidate } = renderScreen();
    vi.mocked(updateTransactionData).mockResolvedValue(transaction);

    await waitFor(() => expect(screen.getByRole("button", { name: "Editar Mercado" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Editar Mercado" }));

    expect(screen.getByRole("dialog", { name: "Editar transação" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Categoria histórica.*Arquivada/ })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Conta histórica" })).toBeDisabled();
    expect(screen.getByLabelText("Método de pagamento (opcional)")).toHaveValue("credit");

    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Mercado semanal" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(updateTransactionData).toHaveBeenCalledWith("transaction-1", { description: "Mercado semanal" }));
    expectTransactionInvalidations(invalidate);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Transação atualizada com sucesso."));
  });

  it("shows deletion confirmation and invalidates every financial dependent after deletion", async () => {
    const transaction = makeTransaction();
    mockScreenQueries({ transactionData: [transaction] });
    const { invalidate } = renderScreen();
    vi.mocked(deleteTransactionData).mockResolvedValue({ deleted: true });

    fireEvent.click(screen.getByRole("button", { name: "Excluir Mercado" }));
    expect(screen.getByRole("dialog", { name: "Excluir transação?" })).toHaveTextContent("Mercado");
    fireEvent.click(screen.getByRole("button", { name: "Excluir transação" }));

    await waitFor(() => expect(deleteTransactionData).toHaveBeenCalledWith("transaction-1"));
    expectTransactionInvalidations(invalidate);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Transação excluída com sucesso."));
  });

  it("opens keyboard-accessible details with historical references, payment method and UTC presentation", async () => {
    const transaction = makeTransaction({
      categoryId: "old-category",
      accountId: "missing-account",
      paymentMethod: "credit",
      source: "telegram",
    });
    mockScreenQueries({
      transactionData: [transaction],
      categories: [makeCategory({ id: "old-category", isActive: false, name: "Categoria histórica" })],
    });
    renderScreen();

    await waitFor(() => expect(screen.getByRole("button", { name: "Ver detalhes de Mercado" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Mercado" }));

    const detailDialog = screen.getByRole("dialog", { name: "Detalhe da transação" });
    expect(detailDialog).toHaveTextContent("Categoria histórica · Arquivada");
    expect(screen.getByText("Conta arquivada ou indisponível")).toBeInTheDocument();
    expect(detailDialog).toHaveTextContent("Crédito");
    expect(detailDialog).toHaveTextContent("Telegram");
    expect(screen.getAllByText(/UTC/).length).toBeGreaterThan(0);

    const editButton = screen.getByRole("button", { name: "Editar" });
    await waitFor(() => expect(document.activeElement).toBe(editButton));
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Detalhe da transação" })).not.toBeInTheDocument());
  });
});
