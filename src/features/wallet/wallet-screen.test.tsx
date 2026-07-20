import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/queries/use-wallet-overview", () => ({ useWalletOverview: vi.fn() }));
vi.mock("@/features/dashboard/queries/use-dashboard-overview", () => ({ useDashboardOverview: vi.fn() }));

import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { useWalletOverview } from "@/features/wallet/queries/use-wallet-overview";
import { WalletScreen } from "@/features/wallet/wallet-screen";

afterEach(cleanup);

const account = {
  id: "account-1", userId: "user-1", name: "Conta principal", bank: "Banco Local", type: "checking",
  color: "not-a-color", icon: "unknown", initialBalance: "100.00", isActive: true,
  createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
};

const invoice = {
  id: "invoice-1", userId: "user-1", creditCardId: "card-1", accountId: "account-1", month: 7, year: 2026,
  dueDate: "2026-07-31T00:30:00.000Z", closingDate: "2026-07-20T00:30:00.000Z", status: "open",
  paidAt: null, paidAmount: null, paidTransactionId: null, totalAmount: "480.00",
  createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
  installments: [{
    id: "installment-1", userId: "user-1", creditCardId: "card-1", invoiceId: "invoice-1", purchaseId: "purchase-1",
    categoryId: null, description: "Compras do cartão", totalPurchaseAmount: "480.00", installmentAmount: "240.00",
    installmentNumber: 1, installmentCount: 2, purchaseDate: "2026-07-10T00:00:00.000Z", dueDate: "2026-07-31T00:30:00.000Z",
    status: "pending", createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
  }],
};

function mockQueries(overrides: Record<string, unknown> = {}) {
  const refetch = vi.fn();
  vi.mocked(useWalletOverview).mockReturnValue({
    data: {
      accounts: [{ account, balance: {
        accountId: "account-1", asOf: "2026-07-20T23:30:00.000Z", initialBalance: "100.00", income: "50.00",
        expense: "20.00", incomingTransfers: "10.00", outgoingTransfers: "5.00", adjustments: "2.00", currentBalance: "137.00",
      } }],
      creditCards: [{
        id: "card-1", userId: "user-1", accountId: "account-1", name: "Cartão Flux", bankName: "Banco Local",
        brand: "Visa", lastFourDigits: "4242", limitAmount: "5000.00", closingDay: 20, dueDay: 31, color: "#197147",
        isActive: true, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
      }],
      invoices: [invoice],
    },
    isPending: false, isError: false, isFetching: false, isRefetchError: false, refetch,
    ...overrides,
  } as never);
  vi.mocked(useDashboardOverview).mockReturnValue({
    data: { balance: { total: "137.00", availableToSpend: "100.00" }, nextInvoice: { amount: "480.00" } },
    isFetching: false, refetch,
  } as never);
  return refetch;
}

describe("WalletScreen", () => {
  it("shows only API-returned financial values and read-only account/card details", () => {
    mockQueries();
    render(<WalletScreen />);

    expect(screen.getAllByText("Conta principal")).not.toHaveLength(0);
    expect(screen.getByText("Saldo total calculado pela API")).toBeInTheDocument();
    expect(screen.getAllByText("Cartão Flux")).not.toHaveLength(0);
    expect(screen.getByText("Compras do cartão")).toBeInTheDocument();
    expect(screen.getByText(/20 de jul. de 2026, 23:30 UTC/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Conta principal/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /Pagar fatura|Adicionar|Transferir/i })).not.toBeInTheDocument();
  });

  it("keeps data visible and retries after a refetch error", () => {
    const refetch = mockQueries({ isError: true, isRefetchError: true });
    render(<WalletScreen />);

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledWith({ cancelRefetch: false });
    expect(screen.getAllByText("Conta principal")).not.toHaveLength(0);
  });

  it("shows a complete empty state without requesting a write action", () => {
    mockQueries({ data: { accounts: [], creditCards: [], invoices: [] } });
    render(<WalletScreen />);

    expect(screen.getByRole("heading", { name: "Sua Carteira ainda não tem itens" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /nova conta|novo cartão/i })).not.toBeInTheDocument();
  });
});
