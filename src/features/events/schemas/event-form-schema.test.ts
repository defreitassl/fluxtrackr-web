import { describe, expect, it } from "vitest";

import type { FinancialEvent } from "@/api/generated/client";
import {
  eventFormSchema,
  toCreateEventPayload,
  toEventFormValues,
  toUpdateEventPayload,
  type EventFormValues,
} from "@/features/events/schemas/event-form-schema";

const accountExpense: EventFormValues = {
  type: "expense",
  name: "IPVA 2026",
  expectedAmount: "1200,50",
  date: "2026-08-01T09:30",
  categoryId: "category-1",
  accountId: "account-1",
  creditCardId: "",
  paymentMethod: "pix",
  installmentCount: "1",
  recurrence: "once",
  notes: "",
};

const baseEvent: FinancialEvent = {
  id: "event-1",
  userId: "user-1",
  type: "expense",
  name: "IPVA 2026",
  expectedAmount: "1200.50",
  date: new Date("2026-08-01T12:30:00.000Z").toISOString(),
  categoryId: "category-1",
  accountId: "account-1",
  creditCardId: null,
  paymentMethod: "pix",
  recurrence: "once",
  installmentCount: 1,
  status: "planned",
  notes: null,
  confirmedTransactionId: null,
  confirmedCreditCardPurchaseId: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("event form schema", () => {
  it("accepts an account expense and maps to a number with two decimal places and ISO date", () => {
    const parsed = eventFormSchema.parse(accountExpense);

    expect(toCreateEventPayload(parsed)).toEqual({
      type: "expense",
      name: "IPVA 2026",
      expectedAmount: 1200.5,
      date: new Date("2026-08-01T09:30").toISOString(),
      categoryId: "category-1",
      accountId: "account-1",
      paymentMethod: "pix",
      recurrence: "once",
      installmentCount: 1,
    });
  });

  it("requires an account and rejects credit card for income events", () => {
    expect(
      eventFormSchema.safeParse({ ...accountExpense, type: "income", accountId: "" }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({
        ...accountExpense,
        type: "income",
        creditCardId: "card-1",
        paymentMethod: "",
      }).success,
    ).toBe(false);
    expect(eventFormSchema.safeParse({ ...accountExpense, type: "income" }).success).toBe(true);
  });

  it("requires exactly one of account or credit card for expenses (XOR)", () => {
    expect(
      eventFormSchema.safeParse({ ...accountExpense, accountId: "", paymentMethod: "" }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({ ...accountExpense, creditCardId: "card-1" }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({
        ...accountExpense,
        accountId: "",
        creditCardId: "card-1",
        paymentMethod: "",
      }).success,
    ).toBe(true);
  });

  it("forbids paymentMethod with card and credit method with account", () => {
    expect(
      eventFormSchema.safeParse({
        ...accountExpense,
        accountId: "",
        creditCardId: "card-1",
        paymentMethod: "pix",
      }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({ ...accountExpense, paymentMethod: "credit" }).success,
    ).toBe(false);
  });

  it("only allows installments above 1 for credit card expenses", () => {
    expect(
      eventFormSchema.safeParse({ ...accountExpense, installmentCount: "3" }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({ ...accountExpense, installmentCount: "121" }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({
        ...accountExpense,
        accountId: "",
        creditCardId: "card-1",
        paymentMethod: "",
        installmentCount: "12",
      }).success,
    ).toBe(true);
  });

  it("diffs updates against the original event and clears fields with null", () => {
    const values = toEventFormValues(baseEvent);
    expect(toUpdateEventPayload(values, baseEvent)).toEqual({});

    const moved = eventFormSchema.parse({
      ...values,
      accountId: "",
      creditCardId: "card-1",
      paymentMethod: "",
      categoryId: "",
    });
    expect(toUpdateEventPayload(moved, baseEvent)).toEqual({
      accountId: null,
      creditCardId: "card-1",
      paymentMethod: null,
      categoryId: null,
    });
  });
});
