import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/queries/use-wallet-overview", () => ({
  useWalletOverview: vi.fn(),
}));

vi.mock("@/features/dashboard/queries/use-dashboard-overview", () => ({
  useDashboardOverview: vi.fn().mockReturnValue({
    data: undefined,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/transactions/api/transactions", () => ({
  listTransactionCategoriesData: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/wallet/credit-cards/mutations/use-pay-credit-card-invoice", () => ({
  usePayCreditCardInvoice: vi.fn().mockReturnValue({ isPending: false, mutate: vi.fn() }),
}));

import { WalletScreen } from "@/features/wallet/wallet-screen";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { useWalletOverview } from "@/features/wallet/queries/use-wallet-overview";
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

const account = {
  account: {
    id: "account-1",
    userId: "user-1",
    name: "Nubank",
    bank: "Nubank",
    type: "checking",
    color: null,
    icon: null,
    initialBalance: "0.00",
    isActive: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  balance: {
    accountId: "account-1",
    asOf: "2026-07-21T12:00:00.000Z",
    initialBalance: "0.00",
    income: "0.00",
    expense: "0.00",
    incomingTransfers: "0.00",
    outgoingTransfers: "0.00",
    adjustments: "0.00",
    currentBalance: "2600.00",
  },
} as never;

const creditCard = {
  id: "card-1",
  userId: "user-1",
  accountId: null,
  name: "Nubank Visa",
  bankName: "Nubank",
  brand: "Visa",
  lastFourDigits: "4821",
  limitAmount: "3000.00",
  closingDay: 11,
  dueDay: 18,
  color: null,
  isActive: true,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
} as never;

const invoice = {
  id: "invoice-1",
  userId: "user-1",
  creditCardId: "card-1",
  accountId: null,
  month: 7,
  year: 2026,
  dueDate: "2026-07-18T00:00:00.000Z",
  closingDate: "2026-07-11T00:00:00.000Z",
  status: "open",
  paidAt: null,
  paidAmount: null,
  paidTransactionId: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  totalAmount: "1280.00",
  installments: [
    {
      id: "installment-1",
      userId: "user-1",
      creditCardId: "card-1",
      invoiceId: "invoice-1",
      purchaseId: "purchase-1",
      categoryId: null,
      description: "iPhone 15",
      totalPurchaseAmount: "6240.00",
      installmentAmount: "520.00",
      installmentNumber: 3,
      installmentCount: 12,
      purchaseDate: "2026-05-10T00:00:00.000Z",
      dueDate: "2026-07-18T00:00:00.000Z",
      status: "pending",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
  ],
} as never;

function mockWallet(state: Record<string, unknown>) {
  vi.mocked(useWalletOverview).mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch: vi.fn(),
    ...state,
  } as never);
}

describe("WalletScreen", () => {
  it("shows the shimmer skeleton while pending", () => {
    mockWallet({ isPending: true });

    render(<WalletScreen />, { wrapper });

    expect(screen.getByRole("status", { name: "Carregando Carteira" })).toBeInTheDocument();
  });

  it("shows the wireframe error state when the wallet fails", () => {
    mockWallet({ isError: true });

    render(<WalletScreen />, { wrapper });

    expect(screen.getByText("Não foi possível carregar a carteira")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("shows the empty state when there are no accounts or cards", () => {
    mockWallet({ data: { accounts: [], creditCards: [], invoices: [] } });

    render(<WalletScreen />, { wrapper });

    expect(screen.getByText("Nenhuma conta ou cartão ainda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar conta/ })).toBeInTheDocument();
  });

  it("renders tiles, accounts, cards and the invoice panel", () => {
    mockWallet({ data: { accounts: [account], creditCards: [creditCard], invoices: [invoice] } });
    vi.mocked(useDashboardOverview).mockReturnValue({
      data: { balance: { availableToSpend: "2150.00" } },
      isFetching: false,
      isPending: false,
      isRefetchError: false,
      refetch: vi.fn(),
    } as never);

    render(<WalletScreen />, { wrapper });

    expect(screen.getByText("Saldo em contas")).toBeInTheDocument();
    expect(screen.getAllByText(/2\.600,00/).length).toBeGreaterThan(0);
    expect(screen.getByText("Faturas em aberto")).toBeInTheDocument();
    expect(screen.getByText("Disponível")).toBeInTheDocument();
    expect(screen.getByText(/2\.150,00/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Nubank Visa/ }).length).toBeGreaterThan(0);
    expect(screen.getByText("Fatura Nubank Visa")).toBeInTheDocument();
    expect(screen.getByText("Lançamentos da fatura")).toBeInTheDocument();
    expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    expect(screen.getByText("3/12")).toBeInTheDocument();
  });

  it("opens the pay drawer with account options from the invoice panel", () => {
    mockWallet({ data: { accounts: [account], creditCards: [creditCard], invoices: [invoice] } });

    render(<WalletScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Pagar fatura" }));

    const drawer = screen.getByRole("dialog", { name: "Pagar fatura" });
    expect(within(drawer).getByText("Valor a pagar")).toBeInTheDocument();
    expect(within(drawer).getByText("Debitar da conta")).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: /Nubank/ })).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Confirmar pagamento" })).toBeInTheDocument();
  });

  it("opens the add dialog with account and card options", () => {
    mockWallet({ data: { accounts: [account], creditCards: [creditCard], invoices: [invoice] } });

    render(<WalletScreen />, { wrapper });

    fireEvent(window, new Event("fluxtrackr:wallet-add"));

    const dialog = screen.getByRole("dialog", { name: "Adicionar à carteira" });
    expect(within(dialog).getByRole("button", { name: /Conta/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Cartão de crédito/ })).toBeInTheDocument();
  });
});
