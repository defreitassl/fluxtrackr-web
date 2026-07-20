import { describe, expect, it } from "vitest";

import { balanceAdjustmentFormSchema } from "@/features/wallet/adjustments/schemas/balance-adjustment-form-schema";

function parse(newBalance: string, reason = "") {
  return balanceAdjustmentFormSchema.safeParse({ newBalance, reason });
}

describe("balanceAdjustmentFormSchema", () => {
  it.each(["1000", "1000,50", "1000.50", "-250", "-250,75", "0", "0,00"])(
    "accepts %s",
    (newBalance) => {
      expect(parse(newBalance).success).toBe(true);
    },
  );

  it.each(["", "  ", "1000,555", "1.2.3", "texto", "1,2,3"])("rejects %s", (newBalance) => {
    expect(parse(newBalance).success).toBe(false);
  });

  it("allows whitespace-only optional reason for mapper normalization", () => {
    expect(parse("100", "   ").success).toBe(true);
  });
});
