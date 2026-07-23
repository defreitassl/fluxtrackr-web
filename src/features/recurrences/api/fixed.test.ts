import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  archiveFixedExpense: vi.fn(),
  archiveFixedIncome: vi.fn(),
  cancelFixedOccurrence: vi.fn(),
  listFixedExpenses: vi.fn(),
  listFixedIncomes: vi.fn(),
  listFixedOccurrences: vi.fn(),
  realizeFixedOccurrence: vi.fn(),
  updateFixedExpense: vi.fn(),
  updateFixedIncome: vi.fn(),
}));

vi.mock("@/features/transactions/api/transactions", () => ({
  createFixedExpenseData: vi.fn(),
  createFixedIncomeData: vi.fn(),
}));

import { listFixedOccurrences, realizeFixedOccurrence } from "@/api/generated/client";
import {
  listFixedOccurrencesData,
  realizeFixedOccurrenceData,
} from "@/features/recurrences/api/fixed";

describe("fixed recurrence API adapters", () => {
  it("unwraps filtered occurrences", async () => {
    const items = [{ id: "occurrence-1", status: "pending" }];
    vi.mocked(listFixedOccurrences).mockResolvedValue({ status: 200, data: items } as never);

    await expect(listFixedOccurrencesData({ status: "pending", type: "expense" })).resolves.toBe(items as never);
    expect(listFixedOccurrences).toHaveBeenCalledWith({ status: "pending", type: "expense" });
  });

  it("requires the 201 realization response", async () => {
    vi.mocked(realizeFixedOccurrence).mockResolvedValue({ status: 201, data: { occurrence: { id: "occurrence-1" }, transaction: { id: "transaction-1" } } } as never);

    await expect(realizeFixedOccurrenceData("occurrence-1", { accountId: "account-1", paymentMethod: "pix" })).resolves.toMatchObject({ transaction: { id: "transaction-1" } });
  });
});
