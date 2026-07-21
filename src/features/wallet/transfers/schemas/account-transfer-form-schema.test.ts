import { describe, expect, it } from "vitest";

import { accountTransferFormSchema } from "@/features/wallet/transfers/schemas/account-transfer-form-schema";

const valid = { sourceAccountId: "source", destinationAccountId: "destination", amount: "250,50", description: "" };

describe("accountTransferFormSchema", () => {
  it("accepts comma and dot decimal inputs", () => {
    expect(accountTransferFormSchema.safeParse(valid).success).toBe(true);
    expect(accountTransferFormSchema.safeParse({ ...valid, amount: "250.50" }).success).toBe(true);
  });

  it.each([
    [{ ...valid, sourceAccountId: "" }],
    [{ ...valid, destinationAccountId: "" }],
    [{ ...valid, destinationAccountId: "source" }],
    [{ ...valid, amount: "" }],
    [{ ...valid, amount: "0" }],
    [{ ...valid, amount: "-1" }],
    [{ ...valid, amount: "1.001" }],
    [{ ...valid, amount: "10000000000" }],
  ])("rejects invalid transfer fields", (value) => {
    expect(accountTransferFormSchema.safeParse(value).success).toBe(false);
  });
});
