import { describe, expect, it } from "vitest";

import {
  createAccountFormSchema,
  editAccountFormSchema,
} from "@/features/wallet/accounts/schemas/account-form-schema";

const base = {
  name: "Conta principal",
  bank: "",
  type: "checking" as const,
  color: "",
  icon: "" as const,
  initialBalance: "1000",
};

function parseCreate(overrides: Partial<typeof base>) {
  return createAccountFormSchema.safeParse({ ...base, ...overrides });
}

function parseEdit(overrides: Partial<Omit<typeof base, "initialBalance">>) {
  const metadata = {
    name: base.name,
    bank: base.bank,
    type: base.type,
    color: base.color,
    icon: base.icon,
  };
  return editAccountFormSchema.safeParse({ ...metadata, ...overrides });
}

describe("account form schemas", () => {
  it("requires a non-empty name", () => {
    expect(parseCreate({ name: "   " }).success).toBe(false);
    expect(parseCreate({ name: "Conta" }).success).toBe(true);
  });

  it("rejects an invalid account type", () => {
    expect(parseCreate({ type: "credit" as never }).success).toBe(false);
  });

  it("requires the initial balance only on creation", () => {
    expect(parseCreate({ initialBalance: "" }).success).toBe(false);
    expect(parseEdit({}).success).toBe(true);
    expect("initialBalance" in editAccountFormSchema.shape).toBe(false);
  });

  it("accepts comma, dot and negative balances", () => {
    expect(parseCreate({ initialBalance: "1000,50" }).success).toBe(true);
    expect(parseCreate({ initialBalance: "1000.50" }).success).toBe(true);
    expect(parseCreate({ initialBalance: "-250,75" }).success).toBe(true);
    expect(parseCreate({ initialBalance: "0" }).success).toBe(true);
  });

  it("rejects more than two decimals and permissive garbage", () => {
    expect(parseCreate({ initialBalance: "1000,555" }).success).toBe(false);
    expect(parseCreate({ initialBalance: "1.2.3" }).success).toBe(false);
    expect(parseCreate({ initialBalance: "abc" }).success).toBe(false);
    expect(parseCreate({ initialBalance: "10-5" }).success).toBe(false);
    expect(parseCreate({ initialBalance: "9".repeat(500) }).success).toBe(false);
  });

  it("rejects whitespace-only bank but accepts empty", () => {
    expect(parseCreate({ bank: "   " }).success).toBe(false);
    expect(parseCreate({ bank: "" }).success).toBe(true);
    expect(parseCreate({ bank: "Banco Local" }).success).toBe(true);
  });

  it("rejects unknown colors and icons", () => {
    expect(parseCreate({ color: "red" }).success).toBe(false);
    expect(parseCreate({ color: "#197147" }).success).toBe(true);
    expect(parseCreate({ icon: "rocket" as never }).success).toBe(false);
    expect(parseCreate({ icon: "wallet" }).success).toBe(true);
  });
});
