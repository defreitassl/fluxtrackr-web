import { describe, expect, it } from "vitest";

import type { FinancialGoal } from "@/api/generated/client";
import {
  contributionFormSchema,
  goalFormSchema,
  toCreateContributionPayload,
  toCreateGoalPayload,
  toGoalFormValues,
  toUpdateGoalPayload,
} from "@/features/goals/schemas/goal-form-schema";

const validGoal = {
  name: "Reserva de emergência",
  description: "",
  targetAmount: "10000,50",
  targetDate: "2027-01-31",
  initialAmount: "250",
};

const baseGoal: FinancialGoal = {
  id: "goal-1",
  name: "Reserva de emergência",
  description: null,
  targetAmount: "10000.50",
  currentAmount: "250.00",
  remainingAmount: "9750.50",
  progressPercentage: "2.50",
  targetDate: "2027-01-31T00:00:00.000Z",
  status: "active",
  completedAt: null,
  canceledAt: null,
  isOverdue: false,
  daysRemaining: 193,
  monthsRemaining: 7,
  requiredMonthlyContribution: "1392.93",
};

describe("goal form schema", () => {
  it("maps Money as a canonical string via toApiMoney (never number)", () => {
    const parsed = goalFormSchema.parse(validGoal);

    expect(toCreateGoalPayload(parsed)).toEqual({
      name: "Reserva de emergência",
      targetAmount: "10000.50",
      targetDate: "2027-01-31",
      initialAmount: "250.00",
    });
  });

  it("rejects zero or malformed target values", () => {
    expect(goalFormSchema.safeParse({ ...validGoal, targetAmount: "0" }).success).toBe(false);
    expect(goalFormSchema.safeParse({ ...validGoal, targetAmount: "1,234" }).success).toBe(false);
    expect(goalFormSchema.safeParse({ ...validGoal, targetAmount: "" }).success).toBe(false);
    expect(goalFormSchema.safeParse({ ...validGoal, initialAmount: "" }).success).toBe(true);
  });

  it("never maps status on update and clears the deadline with null", () => {
    const values = toGoalFormValues(baseGoal);
    expect(toUpdateGoalPayload(values, baseGoal)).toEqual({});

    const cleared = goalFormSchema.parse({ ...values, targetDate: "", name: "Reserva 2" });
    const payload = toUpdateGoalPayload(cleared, baseGoal);
    expect(payload).toEqual({ name: "Reserva 2", targetDate: null });
    expect(payload).not.toHaveProperty("status");
  });

  it("rejects contributions with a future occurredAt", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
    expect(
      contributionFormSchema.safeParse({
        type: "contribution",
        amount: "100",
        occurredAt: future,
        note: "",
      }).success,
    ).toBe(false);
  });

  it("maps contributions with toApiMoney and ISO occurredAt", () => {
    const parsed = contributionFormSchema.parse({
      type: "withdrawal",
      amount: "150,75",
      occurredAt: "2026-07-01T10:00",
      note: "  Resgate parcial  ",
    });

    expect(toCreateContributionPayload(parsed)).toEqual({
      type: "withdrawal",
      amount: "150.75",
      occurredAt: new Date("2026-07-01T10:00").toISOString(),
      note: "Resgate parcial",
    });
  });
});
