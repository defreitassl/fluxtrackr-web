import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/transfers/queries/use-account-transfers", () => ({ useAccountTransfers: vi.fn() }));

import { AccountTransferHistory } from "@/features/wallet/transfers/components/account-transfer-history";
import { useAccountTransfers } from "@/features/wallet/transfers/queries/use-account-transfers";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const accounts = [
  { id: "source", name: "Conta origem" },
  { id: "destination", name: "Conta destino" },
] as never;
const base = {
  userId: "user", sourceAccountId: "source", destinationAccountId: "destination", amount: "250.00", description: "Reserva",
  occurredAt: "2026-07-20T12:00:00.000Z", createdAt: "2026-07-20T12:00:00.000Z", updatedAt: "2026-07-20T12:00:00.000Z",
};

function mockHistory(overrides: Record<string, unknown>) {
  vi.mocked(useAccountTransfers).mockReturnValue({ data: undefined, isPending: false, isError: false, isRefetching: false, isRefetchError: false, refetch: vi.fn(), ...overrides } as never);
}

describe("AccountTransferHistory", () => {
  it("keeps initial loading, errors and empty state local", () => {
    mockHistory({ isPending: true });
    const { rerender } = render(<AccountTransferHistory accountId="source" accounts={accounts} />);
    expect(screen.getByText("Carregando histórico de transferências…")).toBeInTheDocument();

    const refetch = vi.fn();
    mockHistory({ isError: true, refetch });
    rerender(<AccountTransferHistory accountId="source" accounts={accounts} />);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalled();

    mockHistory({ data: [] });
    rerender(<AccountTransferHistory accountId="source" accounts={accounts} />);
    expect(screen.getByText("Nenhuma transferência foi registrada nesta conta.")).toBeInTheDocument();
  });

  it("shows sent and received direction, fallback and five-item expansion", () => {
    const transfers = Array.from({ length: 6 }, (_, index) => ({ ...base, id: `transfer-${index}` }));
    mockHistory({ data: transfers });
    const { rerender } = render(<AccountTransferHistory accountId="source" accounts={accounts} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getAllByText("Enviada").length).toBe(5);
    expect(screen.getAllByText("Conta destino").length).toBe(5);
    fireEvent.click(screen.getByRole("button", { name: "Mostrar todas" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(6);

    mockHistory({ data: [{ ...base, id: "missing", destinationAccountId: "gone" }] });
    rerender(<AccountTransferHistory accountId="source" accounts={accounts} key="other" />);
    expect(screen.getByText("Conta arquivada ou indisponível")).toBeInTheDocument();
  });
});
