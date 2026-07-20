import { describe, expect, it } from "vitest";

import { normalizeDecimalInput, parseFiniteMoneyNumber } from "@/lib/money-input";

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
});

describe("parseFiniteMoneyNumber", () => {
  it("returns a finite number only for a valid decimal", () => {
    expect(parseFiniteMoneyNumber(" -250,75 ")).toBe(-250.75);
    expect(Number.isNaN(parseFiniteMoneyNumber("9".repeat(500)))).toBe(true);
    expect(Number.isNaN(parseFiniteMoneyNumber("texto"))).toBe(true);
  });
});
