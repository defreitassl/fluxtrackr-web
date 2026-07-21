import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/categories/api/categories", () => ({ listCategoriesData: vi.fn() }));
vi.mock("@/features/wallet/credit-cards/api/list-active-credit-cards", () => ({
  listActiveCreditCardsData: vi.fn(),
}));
vi.mock("@/features/wallet/credit-cards/mutations/use-create-credit-card-purchase", () => ({
  useCreateCreditCardPurchase: vi.fn(),
}));

import { listCategoriesData } from "@/features/categories/api/categories";
import { listActiveCreditCardsData } from "@/features/wallet/credit-cards/api/list-active-credit-cards";
import { CreateCreditCardPurchaseDialog } from "@/features/wallet/credit-cards/components/create-credit-card-purchase-dialog";
import { useCreateCreditCardPurchase } from "@/features/wallet/credit-cards/mutations/use-create-credit-card-purchase";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function renderDialog(initialCreditCardId?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const onCreated = vi.fn();
  const onClose = vi.fn();

  render(<CreateCreditCardPurchaseDialog initialCreditCardId={initialCreditCardId} onClose={onClose} onCreated={onCreated} open />, { wrapper });

  return { onClose, onCreated };
}

describe("CreateCreditCardPurchaseDialog", () => {
  it("starts with the optionally supplied card selected", async () => {
    vi.mocked(listActiveCreditCardsData).mockResolvedValue([
      { id: "card-1", name: "Cartão Flux", lastFourDigits: "4242" },
      { id: "card-2", name: "Cartão Reserva", lastFourDigits: "1111" },
    ] as never);
    vi.mocked(listCategoriesData).mockResolvedValue([]);
    vi.mocked(useCreateCreditCardPurchase).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    renderDialog("card-2");

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Cartão Reserva/ })).toBeInTheDocument();
      expect(screen.getByLabelText("Cartão")).toHaveValue("card-2");
    });
  });

  it("is reusable and submits only API-supported purchase fields", async () => {
    vi.mocked(listActiveCreditCardsData).mockResolvedValue([
      { id: "card-1", name: "Cartão Flux", lastFourDigits: "4242" },
    ] as never);
    vi.mocked(listCategoriesData).mockResolvedValue([
      { id: "expense-1", name: "Mercado", type: "expense", isActive: true },
      { id: "both-1", name: "Casa", type: "both", isActive: true },
      { id: "income-1", name: "Salário", type: "income", isActive: true },
    ] as never);
    const mutateAsync = vi.fn().mockResolvedValue({ id: "purchase-1", creditCardId: "card-1" });
    vi.mocked(useCreateCreditCardPurchase).mockReturnValue({ mutateAsync, isPending: false } as never);
    const { onCreated } = renderDialog();

    await waitFor(() => expect(screen.getByRole("option", { name: /Cartão Flux/ })).toBeInTheDocument());
    expect(screen.getByRole("option", { name: "Mercado" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Casa" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Salário" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Cartão"), { target: { value: "card-1" } });
    fireEvent.change(screen.getByLabelText("Categoria (opcional)"), { target: { value: "expense-1" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: " Mercado " } });
    fireEvent.change(screen.getByLabelText("Valor total"), { target: { value: "189,90" } });
    fireEvent.change(screen.getByLabelText("Data e hora local"), { target: { value: "2026-07-20T14:30" } });
    fireEvent.change(screen.getByLabelText("Quantidade de parcelas"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar compra" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({
      creditCardId: "card-1",
      categoryId: "expense-1",
      description: "Mercado",
      totalAmount: 189.9,
      purchaseDate: new Date("2026-07-20T14:30").toISOString(),
      installmentCount: 3,
    }));
    expect(onCreated).toHaveBeenCalledWith({ id: "purchase-1", creditCardId: "card-1" });
  });
});
