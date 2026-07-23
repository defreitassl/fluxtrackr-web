import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  cancelFinancialEvent: vi.fn(),
  confirmFinancialEvent: vi.fn(),
  createFinancialEvent: vi.fn(),
  getFinancialEvent: vi.fn(),
  listFinancialEvents: vi.fn(),
  postponeFinancialEvent: vi.fn(),
  realizeFinancialEvent: vi.fn(),
  updateFinancialEvent: vi.fn(),
}));

import {
  cancelFinancialEvent,
  createFinancialEvent,
  listFinancialEvents,
  postponeFinancialEvent,
  realizeFinancialEvent,
} from "@/api/generated/client";
import {
  cancelFinancialEventData,
  createFinancialEventData,
  listFinancialEventsData,
  postponeFinancialEventData,
  realizeFinancialEventData,
} from "@/features/events/api/financial-events";

describe("financial events API adapters", () => {
  it("unwraps the list and forwards the filters", async () => {
    const events = [{ id: "event-1" }];
    vi.mocked(listFinancialEvents).mockResolvedValue({ status: 200, data: events } as never);

    await expect(listFinancialEventsData({ status: "planned", type: "expense" })).resolves.toBe(events);
    expect(listFinancialEvents).toHaveBeenCalledWith({ status: "planned", type: "expense" });
  });

  it("unwraps creation as 201", async () => {
    const event = { id: "event-1" };
    vi.mocked(createFinancialEvent).mockResolvedValue({ status: 201, data: event } as never);

    await expect(
      createFinancialEventData({
        type: "expense",
        name: "IPVA",
        expectedAmount: 1200.5,
        date: "2026-08-01T12:00:00.000Z",
        accountId: "account-1",
      }),
    ).resolves.toBe(event);
  });

  it("unwraps postpone as 201 with the new date", async () => {
    const event = { id: "event-1", status: "postponed" };
    vi.mocked(postponeFinancialEvent).mockResolvedValue({ status: 201, data: event } as never);

    await expect(
      postponeFinancialEventData("event-1", { date: "2026-09-01T12:00:00.000Z" }),
    ).resolves.toBe(event);
    expect(postponeFinancialEvent).toHaveBeenCalledWith("event-1", { date: "2026-09-01T12:00:00.000Z" });
  });

  it("unwraps the logical cancel (DELETE) as 200", async () => {
    const event = { id: "event-1", status: "canceled" };
    vi.mocked(cancelFinancialEvent).mockResolvedValue({ status: 200, data: event } as never);

    await expect(cancelFinancialEventData("event-1")).resolves.toBe(event);
  });

  it("keeps status failures as ApiError with the API message", async () => {
    vi.mocked(realizeFinancialEvent).mockResolvedValue({
      status: 409,
      data: { message: "Financial event already realized" },
    } as never);

    await expect(realizeFinancialEventData("event-1")).rejects.toMatchObject({
      status: 409,
      message: "Financial event already realized",
    });
  });
});
