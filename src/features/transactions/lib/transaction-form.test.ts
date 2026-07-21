import { describe, expect, it } from "vitest";

import { compatibleCategories, toCreateTransactionPayload, toUpdateTransactionPayload, transactionFormSchema } from "@/features/transactions/lib/transaction-form";

const valid = { type: "expense", amount: "15,90", description: " Almoço ", occurredAt: "2026-07-20T13:30", categoryId: "expense", accountId: "account", paymentMethod: "pix" } as const;

describe("transaction form", () => {
  it("normalizes a valid create payload without trusting a sign", () => {
    expect(transactionFormSchema.safeParse(valid).success).toBe(true);
    expect(toCreateTransactionPayload(valid)).toMatchObject({ type: "expense", amount: 15.9, description: "Almoço", source: "app" });
  });

  it.each(["", "0", "-1", "1.001", "1e3", "10000000000"])("rejects invalid amounts: %s", (amount) => {
    expect(transactionFormSchema.safeParse({ ...valid, amount }).success).toBe(false);
  });

  it("offers only active compatible categories and keeps a minimal update payload", () => {
    const categories = [
      { id: "expense", isActive: true, type: "expense" },
      { id: "income", isActive: true, type: "income" },
      { id: "archived", isActive: false, type: "expense" },
    ] as never;
    expect(compatibleCategories(categories, "expense").map((item) => item.id)).toEqual(["expense"]);
    const initial = { ...valid, amount: "15.90", description: "Almoço", occurredAt: new Date(valid.occurredAt).toISOString(), categoryId: "expense", accountId: "account", paymentMethod: "pix", id: "transaction", userId: "user", source: "app", createdAt: "", updatedAt: "" } as never;
    expect(toUpdateTransactionPayload({ ...valid, amount: "15.90", description: "Almoço", occurredAt: valid.occurredAt }, initial)).toEqual({});
  });
});
