import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/adjustments/queries/use-account-balance-adjustments", () => ({
  useAccountBalanceAdjustments: vi.fn(),
}));

import { AccountAdjustmentHistory } from "@/features/wallet/adjustments/components/account-adjustment-history";
import { useAccountBalanceAdjustments } from "@/features/wallet/adjustments/queries/use-account-balance-adjustments";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const base = {
  userId: "user-1",
  accountId: "account-1",
  previousBalance: "100.00",
  newBalance: "125.00",
  difference: "25.00",
  reason: "Conferência",
  occurredAt: "2026-07-20T12:00:00.000Z",
  createdAt: "2026-07-20T12:00:00.000Z",
};

function mockHistory(overrides: Record<string, unknown>) {
  vi.mocked(useAccountBalanceAdjustments).mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as never);
}

describe("AccountAdjustmentHistory", () => {
  it("keeps loading, error and empty states local to the history", () => {
    mockHistory({ isPending: true });
    const { rerender } = render(<AccountAdjustmentHistory accountId="account-1" />);
    expect(screen.getByText("Carregando histórico de ajustes…")).toBeInTheDocument();

    const refetch = vi.fn();
    mockHistory({ isError: true, refetch });
    rerender(<AccountAdjustmentHistory accountId="account-1" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar o histórico de ajustes.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalled();

    mockHistory({ data: [] });
    rerender(<AccountAdjustmentHistory accountId="account-1" />);
    expect(screen.getByText("Nenhum ajuste foi registrado nesta conta.")).toBeInTheDocument();
  });

  it("renders API values in order and locally toggles five-item expansion", () => {
    const adjustments = Array.from({ length: 6 }, (_, index) => ({
      ...base,
      id: `adjustment-${index}`,
      reason: index === 0 ? null : base.reason,
      occurredAt: `2026-07-${String(20 - index).padStart(2, "0")}T12:00:00.000Z`,
    }));
    mockHistory({ data: adjustments });
    render(<AccountAdjustmentHistory accountId="account-1" />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Mostrar todos")).toBeInTheDocument();
    expect(screen.getAllByText("Saldo anterior")).toHaveLength(5);
    expect(screen.getByText(/20 de jul\. de 2026, 12:00 UTC/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mostrar todos" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Mostrar menos" })).toBeInTheDocument();
  });

  it("preserves stale data and lets the user retry a refetch error", () => {
    const refetch = vi.fn();
    mockHistory({ data: [{ ...base, id: "adjustment-1" }], isError: true, isRefetchError: true, refetch });
    render(<AccountAdjustmentHistory accountId="account-1" />);

    expect(screen.getAllByText("Conferência").length).toBeGreaterThan(0);
    expect(screen.getByRole("alert")).toHaveTextContent("Os dados exibidos podem estar desatualizados");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("keeps an empty state visible when a background refetch fails", () => {
    const refetch = vi.fn();
    mockHistory({ data: [], isError: true, isRefetchError: true, refetch });
    render(<AccountAdjustmentHistory accountId="account-1" />);
    expect(screen.getByText("Nenhum ajuste foi registrado nesta conta.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalled();
  });
});
