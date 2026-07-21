import { describe, expect, it } from "vitest";

import type { BalanceForecast, TimelineItem } from "@/api/generated/client";
import { buildProjectionSeries, buildRealizedSeries } from "@/features/dashboard/lib/balance-series";

const makeItem = (overrides: Partial<TimelineItem>): TimelineItem =>
  ({
    id: "item-1",
    sourceType: "transaction",
    sourceId: "source-1",
    type: "expense",
    title: "Item",
    amount: "0.00",
    date: "2026-07-15T12:00:00.000Z",
    status: "realized",
    balanceImpact: "realized",
    accountId: null,
    creditCardId: null,
    categoryId: null,
    metadata: {},
    ...overrides,
  }) as TimelineItem;

describe("buildRealizedSeries", () => {
  const today = new Date("2026-07-15T18:00:00.000Z");

  it("walks the balance backwards from the current balance using realized net changes", () => {
    const items = [
      makeItem({ id: "expense-today", type: "expense", amount: "100.00", date: "2026-07-15T10:00:00.000Z" }),
      makeItem({ id: "income-yesterday", type: "income", amount: "300.00", date: "2026-07-14T10:00:00.000Z" }),
    ];

    const series = buildRealizedSeries(items, 1000, 2, today);

    expect(series).toHaveLength(3);
    expect(series[2].balance).toBe(1000);
    // ontem terminou com 1000 + 100 (gasto de hoje devolvido) = 1100
    expect(series[1].balance).toBe(1100);
    // anteontem terminou sem a receita de ontem: 1100 - 300 = 800
    expect(series[0].balance).toBe(800);
  });

  it("ignores projected items and transfers", () => {
    const items = [
      makeItem({ id: "projected", type: "expense", amount: "50.00", balanceImpact: "projected" }),
      makeItem({ id: "transfer", type: "transfer", amount: "999.00" }),
    ];

    const series = buildRealizedSeries(items, 500, 1, today);

    expect(series.map((point) => point.balance)).toEqual([500, 500]);
  });
});

describe("buildProjectionSeries", () => {
  it("maps forecast points to dated balances", () => {
    const forecast = {
      points: [
        { date: "2026-07-16", income: "0.00", expense: "10.00", netChange: "-10.00", balance: "990.00" },
        { date: "2026-07-17", income: "5.00", expense: "0.00", netChange: "5.00", balance: "995.00" },
      ],
    } as BalanceForecast;

    const series = buildProjectionSeries(forecast);

    expect(series).toHaveLength(2);
    expect(series[0].balance).toBe(990);
    expect(series[1].date.toISOString()).toBe("2026-07-17T00:00:00.000Z");
  });
});
