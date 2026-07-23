import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  archiveSubscription: vi.fn(),
  cancelSubscriptionCharge: vi.fn(),
  createSubscription: vi.fn(),
  getSubscriptionsSummary: vi.fn(),
  listSubscriptionCharges: vi.fn(),
  listSubscriptions: vi.fn(),
  realizeSubscriptionCharge: vi.fn(),
  updateSubscription: vi.fn(),
}));

import {
  createSubscription,
  listSubscriptionCharges,
  listSubscriptions,
  realizeSubscriptionCharge,
} from "@/api/generated/client";
import {
  createSubscriptionData,
  listSubscriptionChargesData,
  listSubscriptionsData,
  realizeSubscriptionChargeData,
} from "@/features/recurrences/api/subscriptions";

describe("subscription API adapters", () => {
  it("unwraps lists and preserves filters", async () => {
    const items = [{ id: "subscription-1", name: "Streaming" }];
    vi.mocked(listSubscriptions).mockResolvedValue({ status: 200, data: items } as never);

    await expect(listSubscriptionsData({ isActive: true })).resolves.toBe(items as never);
    expect(listSubscriptions).toHaveBeenCalledWith({ isActive: true });
  });

  it("uses 201 for creates and realizations", async () => {
    vi.mocked(createSubscription).mockResolvedValue({ status: 201, data: { id: "subscription-1" } } as never);
    vi.mocked(realizeSubscriptionCharge).mockResolvedValue({ status: 201, data: { charge: { id: "charge-1" } } } as never);

    await expect(createSubscriptionData({ name: "Streaming", amount: 30, nextChargeDate: "2026-07-22T00:00:00.000Z", recurrence: "monthly", accountId: "account-1", paymentMethod: "pix" })).resolves.toMatchObject({ id: "subscription-1" });
    await expect(realizeSubscriptionChargeData("charge-1", {})).resolves.toMatchObject({ charge: { id: "charge-1" } });
  });

  it("keeps unexpected statuses as ApiError", async () => {
    vi.mocked(listSubscriptionCharges).mockResolvedValue({ status: 409, data: { message: "already realized" } } as never);

    await expect(listSubscriptionChargesData({ status: "pending" })).rejects.toMatchObject({ status: 409 });
  });
});
