import { describe, expect, it } from "vitest";

import { toCreateAccountTransferPayload } from "@/features/wallet/transfers/lib/account-transfer-form-mapper";

describe("toCreateAccountTransferPayload", () => {
  it("normalizes the amount and omits a blank description without occurredAt", () => {
    expect(toCreateAccountTransferPayload({
      sourceAccountId: "source", destinationAccountId: "destination", amount: "250,50", description: "   ",
    })).toEqual({ sourceAccountId: "source", destinationAccountId: "destination", amount: "250.50" });
  });
});
