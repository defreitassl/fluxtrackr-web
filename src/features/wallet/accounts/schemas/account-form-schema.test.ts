import { describe, expect, it } from "vitest";

import { accountFormSchema } from "@/features/wallet/accounts/schemas/account-form-schema";

const base = {
  name: "Conta principal",
  bank: "",
  type: "checking" as const,
  color: "",
  icon: "" as const,
  initialBalance: "1000",
};

function parse(overrides: Partial<typeof base>) {
  return accountFormSchema.safeParse({ ...base, ...overrides });
}

describe("accountFormSchema", () => {
  it("requires a non-empty name", () => {
    expect(parse({ name: "   " }).success).toBe(false);
    expect(parse({ name: "Conta" }).success).toBe(true);
  });

  it("rejects an invalid account type", () => {
    expect(parse({ type: "credit" as never }).success).toBe(false);
  });

  it("requires the initial balance", () => {
    expect(parse({ initialBalance: "" }).success).toBe(false);
  });

  it("accepts comma, dot and negative balances", () => {
    expect(parse({ initialBalance: "1000,50" }).success).toBe(true);
    expect(parse({ initialBalance: "1000.50" }).success).toBe(true);
    expect(parse({ initialBalance: "-250,75" }).success).toBe(true);
    expect(parse({ initialBalance: "0" }).success).toBe(true);
  });

  it("rejects more than two decimals and permissive garbage", () => {
    expect(parse({ initialBalance: "1000,555" }).success).toBe(false);
    expect(parse({ initialBalance: "1.2.3" }).success).toBe(false);
    expect(parse({ initialBalance: "abc" }).success).toBe(false);
    expect(parse({ initialBalance: "10-5" }).success).toBe(false);
  });

  it("rejects whitespace-only bank but accepts empty", () => {
    expect(parse({ bank: "   " }).success).toBe(false);
    expect(parse({ bank: "" }).success).toBe(true);
    expect(parse({ bank: "Banco Local" }).success).toBe(true);
  });

  it("rejects unknown colors and icons", () => {
    expect(parse({ color: "red" }).success).toBe(false);
    expect(parse({ color: "#197147" }).success).toBe(true);
    expect(parse({ icon: "rocket" as never }).success).toBe(false);
    expect(parse({ icon: "wallet" }).success).toBe(true);
  });
});
