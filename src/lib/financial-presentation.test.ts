import { describe, expect, it } from "vitest";

import { CreditCardInvoiceStatus } from "@/api/generated/client";
import { getInvoiceStatusLabel } from "@/lib/financial-presentation";

describe("getInvoiceStatusLabel", () => {
  it("translates every invoice status", () => {
    expect(Object.values(CreditCardInvoiceStatus).map(getInvoiceStatusLabel)).toEqual([
      "Em aberto",
      "Fechada",
      "Paga",
      "Vencida",
      "Cancelada",
    ]);
  });
});
