import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({ createAccountBalanceAdjustment: vi.fn() }));

import { createAccountBalanceAdjustment } from "@/api/generated/client";
import { createBalanceAdjustmentData } from "@/features/wallet/adjustments/api/create-balance-adjustment";
import { ApiError } from "@/lib/http";

afterEach(() => {
  vi.resetAllMocks();
});

const response = { adjustment: { id: "adjustment-1" }, currentBalance: "1500.00" };

describe("createBalanceAdjustmentData", () => {
  it("returns only the 201 payload and forwards the canonical request", async () => {
    vi.mocked(createAccountBalanceAdjustment).mockResolvedValue({
      data: response,
      status: 201,
      headers: new Headers(),
    } as never);

    await expect(
      createBalanceAdjustmentData("account-1", { newBalance: "1500.00", reason: "Conferência" }),
    ).resolves.toEqual(response);
    expect(createAccountBalanceAdjustment).toHaveBeenCalledWith("account-1", {
      newBalance: "1500.00",
      reason: "Conferência",
    });
  });

  it("throws ApiError for an unexpected status and preserves API errors", async () => {
    vi.mocked(createAccountBalanceAdjustment).mockResolvedValue({
      data: { message: "invalid" },
      status: 400,
      headers: new Headers(),
    } as never);
    await expect(createBalanceAdjustmentData("account-1", { newBalance: "1" })).rejects.toBeInstanceOf(ApiError);

    const error = new ApiError(503, { message: "offline" });
    vi.mocked(createAccountBalanceAdjustment).mockRejectedValue(error);
    await expect(createBalanceAdjustmentData("account-1", { newBalance: "1" })).rejects.toBe(error);
  });
});
