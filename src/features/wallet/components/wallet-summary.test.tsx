import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WalletSummary } from "@/features/wallet/components/wallet-summary";

afterEach(cleanup);

const dashboard = {
  balance: { total: "137.00", committed: "0.00", availableToSpend: "100.00" },
  nextInvoice: { amount: "480.00" },
} as never;

const counts = { accountCount: 1, cardCount: 1, invoiceCount: 1 };

describe("WalletSummary", () => {
  it("does not claim there is no invoice while the Dashboard is loading", () => {
    render(
      <WalletSummary
        {...counts}
        dashboard={undefined}
        isDashboardLoading
        isDashboardUnavailable={false}
      />,
    );

    expect(screen.queryByText("Sem próxima fatura")).not.toBeInTheDocument();
    expect(screen.queryByText("R$ 0,00")).not.toBeInTheDocument();
    expect(screen.getByText("Carregando panorama…")).toBeInTheDocument();
  });

  it("shows unavailability instead of absence when the Dashboard failed", () => {
    render(
      <WalletSummary
        {...counts}
        dashboard={undefined}
        isDashboardLoading={false}
        isDashboardUnavailable
      />,
    );

    expect(screen.getByText("Panorama indisponível")).toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
    expect(screen.queryByText("Sem próxima fatura")).not.toBeInTheDocument();
    expect(screen.queryByText("R$ 0,00")).not.toBeInTheDocument();
  });

  it("shows the real absence only when nextInvoice is null", () => {
    render(
      <WalletSummary
        {...counts}
        dashboard={{ ...dashboard, nextInvoice: null }}
        isDashboardLoading={false}
        isDashboardUnavailable={false}
      />,
    );

    expect(screen.getByText("Sem próxima fatura")).toBeInTheDocument();
  });

  it("shows the API value when nextInvoice exists", () => {
    render(
      <WalletSummary
        {...counts}
        dashboard={dashboard}
        isDashboardLoading={false}
        isDashboardUnavailable={false}
      />,
    );

    expect(screen.getByText("R$ 480,00")).toBeInTheDocument();
    expect(screen.getByText("Saldo total calculado pela API")).toBeInTheDocument();
  });
});
