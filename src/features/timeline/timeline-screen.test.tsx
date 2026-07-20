import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/timeline/queries/use-financial-timeline", () => ({
  timelineTypeOptions: [
    { value: "income", label: "Receita" },
    { value: "expense", label: "Despesa" },
  ],
  timelineSourceOptions: [
    { value: "transaction", label: "Transação" },
    { value: "financial_event", label: "Evento financeiro" },
  ],
  useFinancialTimeline: vi.fn(),
}));

import { useFinancialTimeline } from "@/features/timeline/queries/use-financial-timeline";
import { TimelineScreen } from "@/features/timeline/timeline-screen";

const timeline = {
  startDate: "2026-07-01T00:00:00.000Z",
  endDate: "2026-07-31T23:59:59.999Z",
  items: [],
  summary: {
    realizedIncome: "0.00",
    realizedExpense: "0.00",
    projectedIncome: "0.00",
    projectedExpense: "0.00",
  },
};

function mockQuery(overrides: Record<string, unknown> = {}) {
  const refetch = vi.fn();
  vi.mocked(useFinancialTimeline).mockReturnValue({
    data: timeline,
    isError: false,
    isFetching: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    refetch,
    ...overrides,
  } as never);
  return refetch;
}

describe("TimelineScreen", () => {
  it("distinguishes an empty month from an empty filtered result and clears filters", () => {
    mockQuery();
    render(<TimelineScreen />);

    expect(screen.getByRole("heading", { name: "Nenhum item neste mês" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "income" } });
    expect(screen.getByRole("heading", { name: "Nenhum resultado para estes filtros" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getByRole("heading", { name: "Nenhum item neste mês" })).toBeInTheDocument();
  });

  it("keeps data visible and exposes a retry after a refetch error", () => {
    const refetch = mockQuery({ isError: true, isRefetchError: true });
    const { rerender } = render(<TimelineScreen />);

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledWith({ cancelRefetch: false });

    mockQuery();
    rerender(<TimelineScreen />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a full error state only when no data is available", () => {
    mockQuery({ data: undefined, isError: true });
    render(<TimelineScreen />);

    expect(screen.getByRole("alert")).toHaveTextContent("Timeline indisponível");
  });
});
