import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { searchParamsMock } = vi.hoisted(() => ({
  searchParamsMock: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: searchParamsMock,
}));

vi.mock("@/features/events/queries/use-financial-events", () => ({
  useFinancialEvents: vi.fn(),
}));

vi.mock("@/features/events/mutations/use-financial-event-mutations", () => {
  const mutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
  return {
    useCreateFinancialEvent: vi.fn(mutation),
    useUpdateFinancialEvent: vi.fn(mutation),
    useConfirmFinancialEvent: vi.fn(mutation),
    usePostponeFinancialEvent: vi.fn(mutation),
    useCancelFinancialEvent: vi.fn(mutation),
    useRealizeFinancialEvent: vi.fn(mutation),
  };
});

vi.mock("@/features/transactions/api/transactions", () => ({
  listTransactionAccountsData: vi.fn().mockResolvedValue([]),
  listTransactionCategoriesData: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/dashboard/queries/use-credit-cards", () => ({
  useCreditCards: vi.fn().mockReturnValue({ data: [], isPending: false, isError: false }),
}));

import type { FinancialEvent } from "@/api/generated/client";
import { EventsScreen } from "@/features/events/events-screen";
import { useFinancialEvents } from "@/features/events/queries/use-financial-events";
import { SearchProvider } from "@/providers/search-provider";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  searchParamsMock.mockReturnValue(new URLSearchParams());
});

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SearchProvider>{children}</SearchProvider>
    </QueryClientProvider>
  );
}

const makeEvent = (overrides: Partial<FinancialEvent> = {}): FinancialEvent => ({
  id: "event-1",
  userId: "user-1",
  type: "expense",
  name: "IPVA 2026",
  expectedAmount: "1200.50",
  date: "2026-08-01T12:00:00.000Z",
  categoryId: null,
  accountId: "account-1",
  creditCardId: null,
  paymentMethod: "pix",
  recurrence: "once",
  installmentCount: 1,
  status: "planned",
  notes: null,
  confirmedTransactionId: null,
  confirmedCreditCardPurchaseId: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  ...overrides,
});

function mockEvents(state: Record<string, unknown>) {
  vi.mocked(useFinancialEvents).mockReturnValue({
    data: undefined,
    isError: false,
    isPending: false,
    isRefetchError: false,
    refetch: vi.fn(),
    ...state,
  } as never);
}

describe("EventsScreen", () => {
  it("shows the skeleton while loading", () => {
    mockEvents({ isPending: true });

    render(<EventsScreen />, { wrapper });

    expect(screen.getByRole("status", { name: "Carregando eventos" })).toBeInTheDocument();
  });

  it("shows the error state on failure", () => {
    mockEvents({ isError: true });

    render(<EventsScreen />, { wrapper });

    expect(screen.getByText("Falha ao carregar eventos")).toBeInTheDocument();
  });

  it("shows the empty state with a create CTA", () => {
    mockEvents({ data: [] });

    render(<EventsScreen />, { wrapper });

    expect(screen.getByText("Nenhum evento por aqui")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Novo evento/ })).toBeInTheDocument();
  });

  it("offers only the valid actions for a planned event (realize disabled with hint)", () => {
    mockEvents({ data: [makeEvent()] });

    render(<EventsScreen />, { wrapper });

    const card = screen.getByRole("article", { name: "IPVA 2026" });
    expect(within(card).getByRole("button", { name: "Confirmar" })).toBeEnabled();
    expect(within(card).getByRole("button", { name: "Adiar" })).toBeEnabled();
    expect(within(card).getByRole("button", { name: "Editar" })).toBeEnabled();
    expect(within(card).getByRole("button", { name: "Cancelar" })).toBeEnabled();
    const realize = within(card).getByRole("button", { name: "Realizar" });
    expect(realize).toBeDisabled();
    expect(realize).toHaveAttribute("title", "Confirme o evento primeiro");
  });

  it("enables realize (and hides edit/confirm) for a confirmed event", () => {
    mockEvents({ data: [makeEvent({ status: "confirmed" })] });

    render(<EventsScreen />, { wrapper });

    const card = screen.getByRole("article", { name: "IPVA 2026" });
    expect(within(card).getByRole("button", { name: "Realizar" })).toBeEnabled();
    expect(within(card).getByRole("button", { name: "Adiar" })).toBeEnabled();
    expect(within(card).queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("offers no actions for realized events", () => {
    mockEvents({ data: [makeEvent({ status: "realized" })] });

    render(<EventsScreen />, { wrapper });

    const card = screen.getByRole("article", { name: "IPVA 2026" });
    expect(within(card).getByText("Realizado")).toBeInTheDocument();
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens the creation drawer via the global header CTA", () => {
    mockEvents({ data: [] });

    render(<EventsScreen />, { wrapper });

    act(() => {
      window.dispatchEvent(new Event("fluxtrackr:new-event"));
    });

    expect(screen.getByRole("dialog", { name: "Novo evento" })).toBeInTheDocument();
  });

  it("highlights and scrolls to the card focused via ?focus=<id>", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("focus=event-2"));
    mockEvents({ data: [makeEvent(), makeEvent({ id: "event-2", name: "Seguro do carro" })] });

    render(<EventsScreen />, { wrapper });

    const focused = screen.getByRole("article", { name: "Seguro do carro" });
    expect(focused).toHaveClass("evx-focused");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
