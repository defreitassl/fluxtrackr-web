import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NextInvoiceCard } from "@/features/dashboard/components/next-invoice-card";

describe("NextInvoiceCard", () => {
  it("shows specific empty state when next invoice is absent", () => {
    render(<NextInvoiceCard invoice={null} />);

    expect(screen.getByRole("heading", { name: "Próxima fatura" })).toBeInTheDocument();
    expect(screen.getByText("Nenhuma próxima fatura com valor pendente.")).toBeInTheDocument();
  });

  it.each([
    ["open", "Em aberto"],
    ["closed", "Fechada"],
    ["paid", "Paga"],
    ["overdue", "Vencida"],
    ["canceled", "Cancelada"],
  ] as const)("translates the %s invoice status", (status, label) => {
    render(
      <NextInvoiceCard
        invoice={{
          id: "invoice-id",
          creditCardId: "card-id",
          creditCardName: "Cartão Flux",
          dueDate: "2026-07-31T12:00:00.000Z",
          status,
          amount: "100.00",
          installmentsCount: 1,
        }}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
