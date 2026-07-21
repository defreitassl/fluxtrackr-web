import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { DashboardOverviewBalance } from "@/api/generated/client";
import { HeroBalance } from "@/features/dashboard/components/hero-balance";

afterEach(cleanup);

const balance: DashboardOverviewBalance = {
  total: "4800.00",
  committed: "2650.00",
  availableToSpend: "2150.00",
  committedBreakdown: {
    creditCardInvoices: "1280.00",
    fixedExpenses: "769.90",
    financialEvents: "560.20",
    subscriptions: "39.90",
  },
};

describe("HeroBalance", () => {
  it("shows available balance, totals and the committed breakdown", () => {
    render(<HeroBalance balance={balance} />);

    expect(screen.getByText("Disponível para gastar")).toBeInTheDocument();
    expect(screen.getByText(/2\.150,00/)).toBeInTheDocument();
    expect(screen.getByText(/4\.800,00/)).toBeInTheDocument();
    expect(screen.getByText(/2\.650,00/)).toBeInTheDocument();
    expect(screen.getByText("Faturas de cartão")).toBeInTheDocument();
    expect(screen.getByText("Gastos fixos")).toBeInTheDocument();
    expect(screen.getByText("Assinaturas")).toBeInTheDocument();
    expect(screen.getByText("Eventos confirmados")).toBeInTheDocument();
  });

  it("omits zeroed committed entries", () => {
    render(
      <HeroBalance
        balance={{
          ...balance,
          committedBreakdown: { ...balance.committedBreakdown, subscriptions: "0.00" },
        }}
      />,
    );

    expect(screen.queryByText("Assinaturas")).not.toBeInTheDocument();
  });

  it("masks values when the eye toggle is pressed", () => {
    render(<HeroBalance balance={balance} />);

    fireEvent.click(screen.getByRole("button", { name: "Ocultar valores" }));

    expect(screen.queryByText(/2\.150,00/)).not.toBeInTheDocument();
    expect(screen.getAllByText("R$ ••••").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Mostrar valores" })).toBeInTheDocument();
  });
});
