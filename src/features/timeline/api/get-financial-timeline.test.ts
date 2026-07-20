import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  getFinancialTimeline: vi.fn(),
}));

import { getFinancialTimeline } from "@/api/generated/client";
import { getFinancialTimelineData } from "@/features/timeline/api/get-financial-timeline";
import { ApiError } from "@/lib/http";

const params = {
  startDate: "2026-07-01T00:00:00.000Z",
  endDate: "2026-07-31T23:59:59.999Z",
  type: "expense" as const,
  sourceType: "transaction" as const,
  includeCanceled: false,
};

const timeline = {
  startDate: params.startDate,
  endDate: params.endDate,
  items: [],
  summary: {
    realizedIncome: "0.00",
    realizedExpense: "0.00",
    projectedIncome: "0.00",
    projectedExpense: "0.00",
  },
};

describe("getFinancialTimelineData", () => {
  it("returns only FinancialTimeline from the Orval response envelope", async () => {
    vi.mocked(getFinancialTimeline).mockResolvedValue({
      data: timeline,
      status: 200,
      headers: new Headers(),
    } as never);

    await expect(getFinancialTimelineData(params)).resolves.toBe(timeline);
    expect(getFinancialTimeline).toHaveBeenCalledWith(params);
  });

  it("preserves ApiError from the HTTP client", async () => {
    const error = new ApiError(503, { message: "Serviço indisponível." });
    vi.mocked(getFinancialTimeline).mockRejectedValueOnce(error);

    await expect(getFinancialTimelineData(params)).rejects.toBe(error);
  });
});
