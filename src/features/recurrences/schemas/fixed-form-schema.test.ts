import { describe, expect, it } from "vitest";

import {
  fixedFormSchema,
  toCreateFixedPayload,
  toUpdateFixedPayload,
} from "@/features/recurrences/schemas/fixed-form-schema";

const values = {
  name: "Internet",
  amount: "120,50",
  day: "10",
  categoryId: "category-1",
  accountId: "account-1",
  paymentMethod: "pix" as const,
  isActive: true,
};

describe("fixed recurrence form schema", () => {
  it("validates day range and rejects credit", () => {
    expect(fixedFormSchema.safeParse(values).success).toBe(true);
    expect(fixedFormSchema.safeParse({ ...values, day: "32" }).success).toBe(false);
    expect(fixedFormSchema.safeParse({ ...values, paymentMethod: "credit" }).success).toBe(false);
  });

  it("maps fixed expense and uses nulls to clear optional update fields", () => {
    const parsed = fixedFormSchema.parse(values);
    expect(toCreateFixedPayload("expense", parsed)).toMatchObject({ amount: 120.5, dueDay: 10, accountId: "account-1" });
    const emptyOptional = fixedFormSchema.parse({ ...values, day: "", categoryId: "", accountId: "", paymentMethod: "" });
    expect(toUpdateFixedPayload("expense", emptyOptional)).toMatchObject({ dueDay: null, categoryId: null, accountId: null, paymentMethod: null });
  });
});
