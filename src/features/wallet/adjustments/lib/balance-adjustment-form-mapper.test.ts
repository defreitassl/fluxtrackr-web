import { describe, expect, it } from "vitest";

import { toCreateBalanceAdjustmentPayload } from "@/features/wallet/adjustments/lib/balance-adjustment-form-mapper";

describe("toCreateBalanceAdjustmentPayload", () => {
  it("keeps the new balance as canonical string and trims a reason", () => {
    expect(
      toCreateBalanceAdjustmentPayload({ newBalance: " -250,75 ", reason: " Conferência manual " }),
    ).toEqual({ newBalance: "-250.75", reason: "Conferência manual" });
  });

  it("omits an empty reason", () => {
    expect(toCreateBalanceAdjustmentPayload({ newBalance: "0", reason: "   " })).toEqual({ newBalance: "0" });
  });
});
