import { describe, expect, it } from "vitest";

import {
  formatPlanningPeriod,
  getCurrentPlanningPeriod,
  movePlanningPeriod,
} from "@/features/planning/lib/planning-period";

describe("planning period", () => {
  it("uses UTC when reading the current planning period", () => {
    expect(getCurrentPlanningPeriod(new Date("2026-01-01T01:30:00.000Z"))).toEqual({
      year: 2026,
      month: 1,
    });
  });

  it("moves across year boundaries without using local dates", () => {
    expect(movePlanningPeriod({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(movePlanningPeriod({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("formats the selected month in Portuguese", () => {
    expect(formatPlanningPeriod({ year: 2026, month: 7 })).toBe("Julho de 2026");
  });
});
