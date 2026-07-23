import { describe, expect, it } from "vitest";

import {
  subscriptionFormSchema,
  toCreateSubscriptionPayload,
  toUpdateSubscriptionPayload,
} from "@/features/recurrences/schemas/subscription-form-schema";

const accountValues = {
  name: "Streaming",
  amount: "39,90",
  nextChargeDate: "2026-08-10",
  recurrence: "monthly" as const,
  categoryId: "category-1",
  accountId: "account-1",
  creditCardId: "",
  paymentMethod: "pix" as const,
  autoRenew: true,
  isActive: true,
};

describe("subscription form schema", () => {
  it("enforces the account/card XOR and payment rules", () => {
    expect(subscriptionFormSchema.safeParse(accountValues).success).toBe(true);
    expect(subscriptionFormSchema.safeParse({ ...accountValues, creditCardId: "card-1" }).success).toBe(false);
    expect(subscriptionFormSchema.safeParse({ ...accountValues, accountId: "", creditCardId: "card-1", paymentMethod: "pix" }).success).toBe(false);
    expect(subscriptionFormSchema.safeParse({ ...accountValues, paymentMethod: "credit" }).success).toBe(false);
  });

  it("maps money as a number and sends nulls when changing account destination to card", () => {
    const parsed = subscriptionFormSchema.parse(accountValues);
    expect(toCreateSubscriptionPayload(parsed)).toMatchObject({ amount: 39.9, nextChargeDate: "2026-08-10T00:00:00.000Z", accountId: "account-1", paymentMethod: "pix" });

    const cardValues = subscriptionFormSchema.parse({ ...accountValues, accountId: "", creditCardId: "card-1", paymentMethod: "" });
    const payload = toUpdateSubscriptionPayload(cardValues, {
      id: "subscription-1",
      name: "Streaming",
      amount: "39.90",
      nextChargeDate: "2026-08-10T00:00:00.000Z",
      recurrence: "monthly",
      categoryId: "category-1",
      accountId: "account-1",
      creditCardId: null,
      paymentMethod: "pix",
      autoRenew: true,
      isActive: true,
    } as never);

    expect(payload).toMatchObject({ accountId: null, creditCardId: "card-1", paymentMethod: null });
  });
});
