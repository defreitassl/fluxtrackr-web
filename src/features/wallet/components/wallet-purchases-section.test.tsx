import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/credit-cards/queries/use-credit-card-purchases", () => ({
  useCreditCardPurchases: vi.fn(),
}));

import { WalletPurchasesSection } from "@/features/wallet/components/wallet-purchases-section";
import { useCreditCardPurchases } from "@/features/wallet/credit-cards/queries/use-credit-card-purchases";

describe("WalletPurchasesSection", () => {
  it("shows purchases and expands their installments", () => {
    vi.mocked(useCreditCardPurchases).mockReturnValue({
      data: [{
        id: "purchase-1",
        description: "Notebook",
        totalAmount: "2400.00",
        purchaseDate: "2026-07-10T12:00:00.000Z",
        installmentCount: 2,
        installments: [
          { id: "installment-1", installmentNumber: 1, installmentCount: 2, dueDate: "2026-08-07T00:00:00.000Z", installmentAmount: "1200.00", status: "pending" },
          { id: "installment-2", installmentNumber: 2, installmentCount: 2, dueDate: "2026-09-07T00:00:00.000Z", installmentAmount: "1200.00", status: "paid" },
        ],
      }],
      isError: false,
      isPending: false,
    } as never);

    render(<WalletPurchasesSection creditCardId="card-1" />);

    expect(screen.getByText("Notebook")).toBeInTheDocument();
    expect(screen.getByText(/2x de R\$\s*1\.200,00/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ver parcelas (2)"));
    expect(screen.getByText(/1\/2 · vence/)).toBeInTheDocument();
    expect(screen.getByText(/2\/2 · vence/)).toBeInTheDocument();
  });
});
