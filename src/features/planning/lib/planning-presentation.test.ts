import { describe, expect, it } from "vitest";

import type { Category, CategoryBudgetOverviewBudgetsItem } from "@/api/generated/client";
import {
  filterBudgetItems,
  formatUsagePercentage,
  getCategoriesWithoutBudget,
  getVisualUsagePercentage,
  sortBudgetItems,
} from "@/features/planning/lib/planning-presentation";

const budget = (id: string, overrides: Record<string, unknown> = {}) =>
  ({
    id,
    category: { id: `category-${id}`, name: `Categoria ${id}`, type: "expense" },
    limitAmount: "100.00",
    warningPercentage: 80,
    transactionSpent: "40.00",
    creditCardSpent: "0.00",
    spentAmount: "40.00",
    remainingAmount: "60.00",
    usagePercentage: "40.00",
    status: "within_budget",
    ...overrides,
  }) as CategoryBudgetOverviewBudgetsItem;

const category = (id: string, type: "income" | "expense" | "both", isActive = true) =>
  ({ id, name: `Categoria ${id}`, type, isActive }) as Category;

describe("planning presentation", () => {
  it("filters only with API statuses", () => {
    const budgets = [
      budget("safe"),
      budget("near", { status: "near_limit" }),
      budget("over", { status: "exceeded" }),
    ];

    expect(filterBudgetItems(budgets, "all")).toHaveLength(3);
    expect(filterBudgetItems(budgets, "near_limit").map((item) => item.id)).toEqual(["near"]);
    expect(filterBudgetItems(budgets, "exceeded").map((item) => item.id)).toEqual(["over"]);
  });

  it("sorts a copy and retains API order on ties", () => {
    const source = [
      budget("first", { usagePercentage: "75.00", category: { id: "1", name: "Zeta", type: "expense" } }),
      budget("second", { usagePercentage: "75.00", category: { id: "2", name: "Alfa", type: "expense" } }),
      budget("third", { usagePercentage: "50.00", category: { id: "3", name: "Beta", type: "expense" } }),
    ];

    const sorted = sortBudgetItems(source, "usage");

    expect(sorted.map((item) => item.id)).toEqual(["first", "second", "third"]);
    expect(source.map((item) => item.id)).toEqual(["first", "second", "third"]);
  });

  it("keeps a real overage in text while limiting only the visual bar", () => {
    expect(getVisualUsagePercentage("125.5")).toBe(100);
    expect(formatUsagePercentage("125.5")).toBe("125,5%");
  });

  it("shows only active expense or both categories without a budget", () => {
    const withoutBudget = getCategoriesWithoutBudget(
      [
        category("budgeted", "expense"),
        category("expense", "expense"),
        category("both", "both"),
        category("income", "income"),
        category("archived", "expense", false),
      ],
      [budget("budgeted", { category: { id: "budgeted", name: "Categoria budgeted", type: "expense" } })],
    );

    expect(withoutBudget.map((item) => item.id)).toEqual(["expense", "both"]);
  });
});
