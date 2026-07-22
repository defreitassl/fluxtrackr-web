import { describe, expect, it } from "vitest";

import { isDecimal12_2, normalizeDecimalInput, parseFiniteMoneyNumber, toApiMoney } from "@/lib/money-input";

describe("normalizeDecimalInput", () => {
  it.each([
    ["1000", "1000"],
    ["1000,50", "1000.50"],
    ["1000.50", "1000.50"],
    ["-250,75", "-250.75"],
    ["0,00", "0.00"],
    ["  42,5  ", "42.5"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeDecimalInput(input)).toBe(expected);
  });

  it.each(["", "1000,555", "1.2.3", "1,2,3", "1,2.3", "10-5", "texto", "Infinity", "-Infinity"])(
    "rejects %s",
    (input) => {
      expect(normalizeDecimalInput(input)).toBe("");
    },
  );

  it("keeps allowed leading zeros while returning a canonical value", () => {
    expect(normalizeDecimalInput("00042,50")).toBe("42.50");
  });
});

describe("isDecimal12_2", () => {
  it.each(["9999999999.99", "-9999999999.99", "0", "0000.50"])("accepts %s", (value) => {
    expect(isDecimal12_2(value)).toBe(true);
  });

  it.each(["10000000000", "-10000000000", "1.001", "1e3", "Infinity", "NaN"])("rejects %s", (value) => {
    expect(isDecimal12_2(value)).toBe(false);
  });
});

describe("parseFiniteMoneyNumber", () => {
  it("returns a finite number only for a valid decimal", () => {
    expect(parseFiniteMoneyNumber(" -250,75 ")).toBe(-250.75);
    expect(Number.isNaN(parseFiniteMoneyNumber("9".repeat(500)))).toBe(true);
    expect(Number.isNaN(parseFiniteMoneyNumber("texto"))).toBe(true);
    expect(Number.isNaN(parseFiniteMoneyNumber("10000000000"))).toBe(true);
  });
});

describe("toApiMoney", () => {
  it("pads to exactly two decimal places as the API requires", () => {
    expect(toApiMoney("1500")).toBe("1500.00");
    expect(toApiMoney("1500,5")).toBe("1500.50");
    expect(toApiMoney("1200,50")).toBe("1200.50");
    expect(toApiMoney("abc")).toBe("");
  });
});
