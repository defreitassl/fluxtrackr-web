import { describe, expect, it } from "vitest";

import {
  recurrenceRailDateRange,
  toRecurrenceRailItems,
} from "@/features/recurrences/lib/recurrence-presentation";

describe("recurrence presentation", () => {
  it("merges active template pending charges and occurrences in ascending date order", () => {
    const items = toRecurrenceRailItems({
      activeSubscriptionIds: new Set(["subscription-1"]),
      activeFixedExpenseIds: new Set(["fixed-expense-1"]),
      activeFixedIncomeIds: new Set(),
      subscriptionCharges: [
        { id: "charge-later", subscriptionId: "subscription-1", status: "pending", name: "Streaming", amount: "30.00", chargeDate: "2026-08-10T12:00:00.000Z", categoryId: null, accountId: "account-1", creditCardId: null, paymentMethod: "pix" },
        { id: "charge-archived", subscriptionId: "subscription-old", status: "pending", name: "Old", amount: "10.00", chargeDate: "2026-08-01T12:00:00.000Z", categoryId: null, accountId: "account-1", creditCardId: null, paymentMethod: "pix" },
      ] as never,
      fixedOccurrences: [
        { id: "occurrence-first", type: "expense", status: "pending", fixedExpenseId: "fixed-expense-1", fixedIncomeId: null, name: "Internet", amount: "100.00", occurrenceDate: "2026-08-03T00:00:00.000Z", categoryId: null, accountId: "account-1", paymentMethod: "pix" },
        { id: "occurrence-archived", type: "income", status: "pending", fixedExpenseId: null, fixedIncomeId: "fixed-income-old", name: "Old income", amount: "100.00", occurrenceDate: "2026-08-02T00:00:00.000Z", categoryId: null, accountId: "account-1", paymentMethod: "pix" },
      ] as never,
    });

    expect(items.map((item) => item.id)).toEqual(["occurrence-first", "charge-later"]);
  });

  it("keeps the rail boundary through the end of day +45 in UTC", () => {
    const range = recurrenceRailDateRange(new Date("2026-07-22T13:00:00.000Z"));
    expect(range.startDate).toBe("2026-07-22T00:00:00.000Z");
    expect(range.endDate).toBe("2026-09-05T23:59:59.999Z");
  });
});
