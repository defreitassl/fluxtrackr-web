import { describe, expect, it } from "vitest";

import {
  createTimelineDateRange,
  getUtcMonthRange,
  getUtcMonthStart,
  moveUtcMonth,
} from "@/features/timeline/lib/timeline-date-range";

describe("timeline UTC date ranges", () => {
  it.each([
    ["2026-02-15T14:00:00.000Z", "2026-02-01T00:00:00.000Z", "2026-02-28T23:59:59.999Z"],
    ["2024-02-15T14:00:00.000Z", "2024-02-01T00:00:00.000Z", "2024-02-29T23:59:59.999Z"],
    ["2026-04-15T14:00:00.000Z", "2026-04-01T00:00:00.000Z", "2026-04-30T23:59:59.999Z"],
    ["2026-07-15T14:00:00.000Z", "2026-07-01T00:00:00.000Z", "2026-07-31T23:59:59.999Z"],
  ])("builds UTC boundaries for %s", (reference, startDate, endDate) => {
    expect(getUtcMonthRange(new Date(reference))).toEqual({ startDate, endDate });
  });

  it("moves months using UTC fields without timezone conversion", () => {
    expect(moveUtcMonth(getUtcMonthStart(new Date("2026-01-31T23:00:00.000Z")), -1).toISOString())
      .toBe("2025-12-01T00:00:00.000Z");
  });

  it("rejects ranges longer than 366 days", () => {
    expect(() =>
      createTimelineDateRange(
        new Date("2024-01-01T00:00:00.000Z"),
        new Date("2025-01-02T00:00:00.000Z"),
      ),
    ).toThrow("366 dias");
  });
});
