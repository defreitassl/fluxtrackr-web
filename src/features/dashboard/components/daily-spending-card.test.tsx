import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DailySpendingCard } from "@/features/dashboard/components/daily-spending-card";

describe("DailySpendingCard", () => {
  it.each([
    ["within_plan", "Dentro do planejado"],
    ["over_plan", "Acima do planejado"],
    ["no_available_balance", "Sem saldo disponível"],
  ] as const)("maps %s status", (status, label) => {
    render(
      <DailySpendingCard
        dailySpending={{
          recommended: "100.00",
          spentToday: "20.00",
          remainingToday: "80.00",
          daysRemainingInMonth: 10,
          status,
        }}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
