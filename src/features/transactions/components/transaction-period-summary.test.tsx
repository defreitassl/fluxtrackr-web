import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TransactionPeriodSummary } from "@/features/transactions/components/transaction-period-summary";

afterEach(cleanup);

describe("TransactionPeriodSummary", () => {
  it("renders only the consolidated totals returned by the API", () => {
    render(
      <TransactionPeriodSummary
        isError={false}
        isLoading={false}
        periodLabel="Julho de 2026"
        summary={{
          year: 2026,
          month: 7,
          fixedIncomeTotal: 0,
          fixedExpenseTotal: 0,
          transactionIncomeTotal: 1200.5,
          transactionExpenseTotal: 450.25,
          availableBalance: 750.25,
          daysInMonth: 31,
          currentDay: 20,
          remainingDays: 11,
          suggestedDailyBudget: 0,
          expensesByCategory: [],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Julho de 2026" })).toBeInTheDocument();
    expect(screen.getByText("Receitas lançadas").nextElementSibling).toHaveTextContent("1.200,50");
    expect(screen.getByText("Despesas lançadas").nextElementSibling).toHaveTextContent("450,25");
    expect(screen.getByText("Saldo disponível").nextElementSibling).toHaveTextContent("750,25");
  });

  it("renders loading and error states without inventing summary values", () => {
    const { rerender } = render(
      <TransactionPeriodSummary isError={false} isLoading periodLabel="Julho de 2026" summary={undefined} />,
    );

    expect(document.querySelector('[aria-label="Carregando resumo mensal"]')).toBeInTheDocument();
    expect(screen.queryByText("Receitas lançadas")).not.toBeInTheDocument();

    rerender(
      <TransactionPeriodSummary isError isLoading={false} periodLabel="Julho de 2026" summary={undefined} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar o resumo mensal.");
  });
});
