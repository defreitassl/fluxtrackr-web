import { describe, expect, it } from "vitest";

import {
  categoryBudgetFormSchema,
  toCreateCategoryBudgetPayload,
  toUpdateCategoryBudgetPayload,
} from "@/features/planning/schemas/category-budget-form-schema";

const validValues = {
  categoryId: "category-1",
  limitAmount: "1200,50",
  warningPercentage: 80,
};

describe("category budget form schema", () => {
  it("accepts a positive Decimal(12,2) limit and canonicalizes it for the API", () => {
    const parsed = categoryBudgetFormSchema.parse(validValues);

    expect(toCreateCategoryBudgetPayload(parsed, { year: 2026, month: 7 })).toEqual({
      categoryId: "category-1",
      year: 2026,
      month: 7,
      limitAmount: "1200.50",
      warningPercentage: 80,
    });
    expect(toUpdateCategoryBudgetPayload(parsed)).toEqual({
      limitAmount: "1200.50",
      warningPercentage: 80,
    });
  });

  it("rejects zero, more than two decimals and values outside Decimal(12,2)", () => {
    expect(categoryBudgetFormSchema.safeParse({ ...validValues, limitAmount: "0" }).success).toBe(false);
    expect(categoryBudgetFormSchema.safeParse({ ...validValues, limitAmount: "1,234" }).success).toBe(false);
    expect(categoryBudgetFormSchema.safeParse({ ...validValues, limitAmount: "10000000000" }).success).toBe(false);
  });

  it("uses the DTO limits for the warning percentage", () => {
    expect(categoryBudgetFormSchema.safeParse({ ...validValues, warningPercentage: 1 }).success).toBe(true);
    expect(categoryBudgetFormSchema.safeParse({ ...validValues, warningPercentage: 100 }).success).toBe(true);
    expect(categoryBudgetFormSchema.safeParse({ ...validValues, warningPercentage: 0 }).success).toBe(false);
    expect(categoryBudgetFormSchema.safeParse({ ...validValues, warningPercentage: 80.5 }).success).toBe(false);
  });
});
