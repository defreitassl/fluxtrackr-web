import { describe, expect, it } from "vitest";

import type { Account, Category, TimelineItem } from "@/api/generated/client";
import {
  matchesChipFilter,
  timelineItemTone,
  timelineItemView,
} from "@/features/timeline/lib/timeline-item-presentation";

const makeItem = (overrides: Partial<TimelineItem>): TimelineItem =>
  ({
    id: "item-1",
    sourceType: "transaction",
    sourceId: "source-1",
    type: "expense",
    title: "Item",
    amount: "100.00",
    date: "2026-07-15T12:00:00.000Z",
    status: "realized",
    balanceImpact: "realized",
    accountId: null,
    creditCardId: null,
    categoryId: null,
    metadata: {},
    ...overrides,
  }) as TimelineItem;

const categoriesById = new Map<string, Category>([
  ["cat-1", { id: "cat-1", name: "Alimentação", type: "expense", isActive: true } as Category],
]);
const accountsById = new Map<string, Account>([
  ["acc-1", { id: "acc-1", name: "Banco Inter" } as Account],
  ["acc-2", { id: "acc-2", name: "Nubank" } as Account],
]);

describe("timelineItemTone", () => {
  it("maps invoice to amber, income to green, expense to red, transfer to blue", () => {
    expect(timelineItemTone(makeItem({ sourceType: "credit_card_invoice" }))).toBe("amber");
    expect(timelineItemTone(makeItem({ type: "income" }))).toBe("green");
    expect(timelineItemTone(makeItem({ type: "expense" }))).toBe("red");
    expect(timelineItemTone(makeItem({ type: "transfer" }))).toBe("blue");
    expect(timelineItemTone(makeItem({ sourceType: "subscription" }))).toBe("blue");
  });
});

describe("timelineItemView", () => {
  it("resolves category, account and payment method for transactions", () => {
    const view = timelineItemView(
      makeItem({ categoryId: "cat-1", accountId: "acc-1", metadata: { paymentMethod: "pix" } }),
      categoriesById,
      accountsById,
    );

    expect(view.metaParts).toEqual(["Alimentação", "Banco Inter"]);
    expect(view.methodLabel).toBe("Pix");
    expect(view.value).toContain("−");
    expect(view.valueTone).toBe("red");
  });

  it("labels invoices with the card name and amber value", () => {
    const view = timelineItemView(
      makeItem({
        sourceType: "credit_card_invoice",
        title: "Fatura Nubank - 07/2026",
        balanceImpact: "projected",
        metadata: { creditCard: { id: "cc-1", name: "Nubank Visa" } },
      }),
      categoriesById,
      accountsById,
    );

    expect(view.isInvoice).toBe(true);
    expect(view.metaParts).toEqual(["Cartão de crédito", "Nubank Visa"]);
    expect(view.valueTone).toBe("amber");
    expect(view.note).toContain("quando você paga a fatura");
  });

  it("shows transfers as neutral with source and destination accounts", () => {
    const view = timelineItemView(
      makeItem({
        sourceType: "account_transfer",
        type: "transfer",
        metadata: { sourceAccountId: "acc-1", destinationAccountId: "acc-2" },
      }),
      categoriesById,
      accountsById,
    );

    expect(view.valueTone).toBe("text");
    expect(view.metaParts[1]).toBe("Banco Inter → Nubank");
    expect(view.note).toContain("não conta como receita nem despesa");
  });

  it("marks fixed occurrences and subscriptions as recurring", () => {
    expect(timelineItemView(makeItem({ sourceType: "fixed_expense" }), categoriesById, accountsById).isRecurring).toBe(true);
    expect(timelineItemView(makeItem({ sourceType: "subscription" }), categoriesById, accountsById).isRecurring).toBe(true);
    expect(timelineItemView(makeItem({}), categoriesById, accountsById).isRecurring).toBe(false);
  });
});

describe("matchesChipFilter", () => {
  it("filters by chip semantics", () => {
    const invoice = makeItem({ sourceType: "credit_card_invoice", type: "expense" });
    const income = makeItem({ type: "income" });
    const fixed = makeItem({ sourceType: "fixed_expense" });

    expect(matchesChipFilter(invoice, "all")).toBe(true);
    expect(matchesChipFilter(invoice, "invoices")).toBe(true);
    expect(matchesChipFilter(invoice, "expense")).toBe(false);
    expect(matchesChipFilter(income, "income")).toBe(true);
    expect(matchesChipFilter(fixed, "recurring")).toBe(true);
    expect(matchesChipFilter(fixed, "income")).toBe(false);
  });
});
