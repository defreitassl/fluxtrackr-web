import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/dashboard?tab=overview", "/dashboard?tab=overview"],
    ["//example.com", "/dashboard"],
    ["https://example.com/dashboard", "/dashboard"],
    ["\\example.com", "/dashboard"],
    ["/\\example.com", "/dashboard"],
    ["javascript:alert(1)", "/dashboard"],
    ["/%2F%2Fevil.example", "/dashboard"],
  ])("returns %s safely", (value, expected) => {
    expect(safeRedirectPath(value)).toBe(expected);
  });
});
