import { describe, expect, it } from "vitest";

import type { Account } from "@/api/generated/client";
import {
  toCreateAccountPayload,
  toEditAccountFormValues,
  toUpdateAccountPayload,
} from "@/features/wallet/accounts/lib/account-form-mappers";
import type {
  CreateAccountFormValues,
  EditAccountFormValues,
} from "@/features/wallet/accounts/schemas/account-form-schema";

const createValues: CreateAccountFormValues = {
  name: "  Conta principal  ",
  bank: "  Banco Local  ",
  type: "savings",
  color: "#197147",
  icon: "piggy-bank",
  initialBalance: "1000,50",
};

const editValues: EditAccountFormValues = {
  name: createValues.name,
  bank: createValues.bank,
  type: createValues.type,
  color: createValues.color,
  icon: createValues.icon,
};

describe("toCreateAccountPayload", () => {
  it("trims the name, normalizes the balance and includes optional fields", () => {
    expect(toCreateAccountPayload(createValues)).toEqual({
      name: "Conta principal",
      type: "savings",
      initialBalance: 1000.5,
      bank: "Banco Local",
      color: "#197147",
      icon: "piggy-bank",
    });
  });

  it("omits empty optional fields on creation", () => {
    const payload = toCreateAccountPayload({ ...createValues, bank: "  ", color: "", icon: "" });
    expect(payload).not.toHaveProperty("bank");
    expect(payload).not.toHaveProperty("color");
    expect(payload).not.toHaveProperty("icon");
    expect(payload.initialBalance).toBe(1000.5);
  });
});

describe("toUpdateAccountPayload", () => {
  it("sends null when the user clears optional fields and never sends initialBalance", () => {
    const payload = toUpdateAccountPayload({ ...editValues, bank: "  ", color: "", icon: "" });
    expect(payload).toEqual({
      name: "Conta principal",
      type: "savings",
      bank: null,
      color: null,
      icon: null,
    });
    expect(payload).not.toHaveProperty("initialBalance");
  });

  it("keeps filled metadata", () => {
    expect(toUpdateAccountPayload(editValues)).toEqual({
      name: "Conta principal",
      type: "savings",
      bank: "Banco Local",
      color: "#197147",
      icon: "piggy-bank",
    });
  });
});

describe("toEditAccountFormValues", () => {
  it("prefills metadata and drops unknown icon/color", () => {
    const account = {
      id: "a1",
      name: "Conta",
      bank: null,
      type: "checking",
      color: "not-a-color",
      icon: "unknown",
      initialBalance: "100.00",
    } as Account;

    expect(toEditAccountFormValues(account)).toEqual({
      name: "Conta",
      bank: "",
      type: "checking",
      color: "",
      icon: "",
    });
  });
});
