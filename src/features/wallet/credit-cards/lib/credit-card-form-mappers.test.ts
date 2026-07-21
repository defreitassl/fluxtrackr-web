import { describe, expect, it } from "vitest";

import {
  toCreateCreditCardPayload,
  toUpdateCreditCardPayload,
} from "@/features/wallet/credit-cards/lib/credit-card-form-mappers";

describe("credit card form mappers", () => {
  it("sends only configured optional card metadata on creation", () => {
    expect(toCreateCreditCardPayload({
      accountId: "",
      name: " Cartão Flux ",
      bankName: "",
      brand: "Visa",
      lastFourDigits: "4242",
      limitAmount: "3000,50",
      closingDay: "20",
      dueDay: "17",
      color: "",
    })).toEqual({
      name: "Cartão Flux",
      brand: "Visa",
      lastFourDigits: "4242",
      limitAmount: 3000.5,
      closingDay: 20,
      dueDay: 17,
    });
  });

  it("maps cleared optional fields to null on card update", () => {
    expect(toUpdateCreditCardPayload({
      accountId: "",
      name: "Cartão Flux",
      bankName: "",
      brand: "",
      lastFourDigits: "",
      limitAmount: "0",
      closingDay: "",
      dueDay: "17",
      color: "",
    })).toEqual({
      accountId: null,
      name: "Cartão Flux",
      bankName: null,
      brand: null,
      lastFourDigits: null,
      limitAmount: 0,
      closingDay: null,
      dueDay: 17,
      color: null,
    });
  });
});
