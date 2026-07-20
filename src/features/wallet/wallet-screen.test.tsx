import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/queries/use-wallet-overview", () => ({ useWalletOverview: vi.fn() }));
vi.mock("@/features/dashboard/queries/use-dashboard-overview", () => ({ useDashboardOverview: vi.fn() }));
vi.mock("@/features/wallet/accounts/mutations/use-create-account", () => ({ useCreateAccount: vi.fn() }));
vi.mock("@/features/wallet/accounts/mutations/use-update-account", () => ({ useUpdateAccount: vi.fn() }));

import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { useCreateAccount } from "@/features/wallet/accounts/mutations/use-create-account";
import { useUpdateAccount } from "@/features/wallet/accounts/mutations/use-update-account";
import { useWalletOverview } from "@/features/wallet/queries/use-wallet-overview";
import { WalletScreen } from "@/features/wallet/wallet-screen";

afterEach(cleanup);

const account = {
  id: "account-1", userId: "user-1", name: "Conta principal", bank: "Banco Local", type: "checking",
  color: "not-a-color", icon: "unknown", initialBalance: "100.00", isActive: true,
  createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
};

const balance = {
  accountId: "account-1", asOf: "2026-07-20T23:30:00.000Z", initialBalance: "100.00", income: "50.00",
  expense: "20.00", incomingTransfers: "10.00", outgoingTransfers: "5.00", adjustments: "2.00", currentBalance: "137.00",
};

const card = {
  id: "card-1", userId: "user-1", accountId: "account-1", name: "Cartão Flux", bankName: "Banco Local",
  brand: "Visa", lastFourDigits: "4242", limitAmount: "5000.00", closingDay: 20, dueDay: 31, color: "#197147",
  isActive: true, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
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

function mockWallet(overrides: Record<string, unknown> = {}) {
  const refetch = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useWalletOverview).mockReturnValue({
    data: { accounts: [{ account, balance }], creditCards: [card], invoices: [invoice] },
    isPending: false, isError: false, isFetching: false, isRefetchError: false, refetch,
    ...overrides,
  } as never);
  return refetch;
}

function mockDashboard(overrides: Record<string, unknown> = {}) {
  const refetch = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useDashboardOverview).mockReturnValue({
    data: { balance: { total: "137.00", availableToSpend: "100.00" }, nextInvoice: { amount: "480.00" } },
    isPending: false, isError: false, isFetching: false, isRefetchError: false, refetch,
    ...overrides,
  } as never);
  return refetch;
}

function mockMutations() {
  vi.mocked(useCreateAccount).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ ...account, id: "account-new", name: "Conta nova" }),
    isPending: false, reset: vi.fn(),
  } as never);
  vi.mocked(useUpdateAccount).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ ...account, name: "Conta editada" }),
    isPending: false, reset: vi.fn(),
  } as never);
}

describe("WalletScreen", () => {
  it("shows only API-returned financial values and read-only account/card details", () => {
    mockWallet();
    mockDashboard();
    mockMutations();
    render(<WalletScreen />);

    expect(screen.getAllByText("Conta principal")).not.toHaveLength(0);
    expect(screen.getByText("Saldo total calculado pela API")).toBeInTheDocument();
    expect(screen.getAllByText("Cartão Flux")).not.toHaveLength(0);
    expect(screen.getByText("Compras do cartão")).toBeInTheDocument();
    expect(screen.getByText(/20 de jul. de 2026, 23:30 UTC/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Conta principal/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /Pagar fatura|Transferir|Arquivar|Excluir/i })).not.toBeInTheDocument();
  });

  it("keeps data visible and retries after a wallet refetch error", () => {
    const refetch = mockWallet({ isRefetchError: true });
    mockDashboard();
    mockMutations();
    render(<WalletScreen />);

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar todos os dados");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledWith({ cancelRefetch: false });
    expect(screen.getAllByText("Conta principal")).not.toHaveLength(0);
  });

  it("communicates a Dashboard-only refetch failure with a distinct message", () => {
    mockWallet();
    mockDashboard({ isRefetchError: true });
    mockMutations();
    render(<WalletScreen />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "As contas e cartões foram atualizados, mas o panorama financeiro pode estar desatualizado.",
    );
  });

  it("does not treat a loading Dashboard as an absent invoice", () => {
    mockWallet();
    mockDashboard({ data: undefined, isPending: true });
    mockMutations();
    render(<WalletScreen />);

    expect(screen.queryByText("Sem próxima fatura")).not.toBeInTheDocument();
    expect(screen.getByText("Carregando panorama…")).toBeInTheDocument();
  });

  it("shows the empty state with a create action and no destructive action", () => {
    mockWallet({ data: { accounts: [], creditCards: [], invoices: [] } });
    mockDashboard();
    mockMutations();
    render(<WalletScreen />);

    expect(screen.getByRole("heading", { name: "Sua Carteira ainda não tem itens" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nova conta/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Arquivar|Excluir|Transferir/i })).not.toBeInTheDocument();
  });

  it("keeps a card without invoice selectable and orphan invoices accessible", () => {
    mockWallet({
      data: {
        accounts: [{ account, balance }],
        creditCards: [{ ...card, id: "card-empty", name: "Cartão sem fatura" }],
        invoices: [{ ...invoice, id: "invoice-orphan", creditCardId: "archived-card" }],
      },
    });
    mockDashboard();
    mockMutations();
    render(<WalletScreen />);

    expect(screen.getByRole("button", { name: /Cartão sem fatura/ })).toBeInTheDocument();
    expect(screen.getByText("Este cartão não possui fatura no mês UTC atual.")).toBeInTheDocument();
    expect(screen.getByText("Cartão arquivado ou indisponível")).toBeInTheDocument();
  });

  it("creates an account and shows inline success feedback", async () => {
    mockWallet();
    mockDashboard();
    mockMutations();
    render(<WalletScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Nova conta/ }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Conta nova" } });
    fireEvent.change(screen.getByLabelText("Saldo inicial"), { target: { value: "1000,50" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    const created = await screen.findByText("Conta criada com sucesso.");
    expect(created).toHaveAttribute("role", "status");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Nova conta" })).not.toBeInTheDocument(),
    );
  });

  it("opens a prefilled edit dialog without the initial balance field", () => {
    mockWallet();
    mockDashboard();
    mockMutations();
    render(<WalletScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Editar conta/ }));

    expect(screen.getByRole("dialog", { name: "Editar conta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Conta principal");
    expect(screen.queryByLabelText("Saldo inicial")).not.toBeInTheDocument();
    expect(
      screen.getByText(/O saldo inicial não pode ser alterado por esta tela/),
    ).toBeInTheDocument();
  });

  it("closes the dialog with Escape and returns focus to the trigger", async () => {
    mockWallet();
    mockDashboard();
    mockMutations();
    render(<WalletScreen />);

    const trigger = screen.getByRole("button", { name: /Editar conta/ });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Editar conta" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Editar conta" })).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });
});
