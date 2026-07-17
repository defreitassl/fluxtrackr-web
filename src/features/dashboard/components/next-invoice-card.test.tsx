import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NextInvoiceCard } from "@/features/dashboard/components/next-invoice-card";

describe("NextInvoiceCard", () => {
  it("shows specific empty state when next invoice is absent", () => {
    render(<NextInvoiceCard invoice={null} />);

    expect(screen.getByRole("heading", { name: "Próxima fatura" })).toBeInTheDocument();
    expect(screen.getByText("Nenhuma próxima fatura com valor pendente.")).toBeInTheDocument();
  });
});
