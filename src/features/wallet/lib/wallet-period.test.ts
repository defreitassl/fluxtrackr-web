import { describe, expect, it } from "vitest";

import { getCurrentUtcWalletPeriod } from "@/features/wallet/lib/wallet-period";
import { formatUtcDate, formatUtcDateTime, getAccountTypeLabel, getInvoiceStatusLabel, isSafeHexColor } from "@/features/wallet/lib/wallet-presentation";

describe("wallet UTC period and presentation", () => {
  it.each([
    ["2026-12-31T23:30:00.000Z", { year: 2026, month: 12 }],
    ["2027-01-01T00:30:00.000Z", { year: 2027, month: 1 }],
  ])("uses UTC fields for %s", (reference, period) => {
    expect(getCurrentUtcWalletPeriod(new Date(reference))).toEqual(period);
  });

  it("uses UTC for financial dates and labels known API enums", () => {
    expect(formatUtcDate("2026-07-20T00:30:00.000Z")).toBe("20 de jul. de 2026");
    expect(formatUtcDateTime("2026-07-20T23:30:00.000Z")).toBe("20 de jul. de 2026, 23:30 UTC");
    expect(getAccountTypeLabel("savings")).toBe("Poupança");
    expect(getInvoiceStatusLabel("overdue")).toBe("Vencida");
  });

  it("accepts only safe hexadecimal colors", () => {
    expect(isSafeHexColor("#197147")).toBe(true);
    expect(isSafeHexColor("#197")).toBe(true);
    expect(isSafeHexColor("javascript:alert(1)")).toBe(false);
    expect(isSafeHexColor(null)).toBe(false);
  });
});
