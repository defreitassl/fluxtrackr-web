import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({ listAccountBalanceAdjustments: vi.fn() }));

import { listAccountBalanceAdjustments } from "@/api/generated/client";
import { listBalanceAdjustmentsData } from "@/features/wallet/adjustments/api/list-balance-adjustments";
import { ApiError } from "@/lib/http";

afterEach(() => {
  vi.resetAllMocks();
});

const adjustments = [{ id: "newest" }, { id: "oldest" }];

describe("listBalanceAdjustmentsData", () => {
  it("unwraps the 200 payload without changing API order", async () => {
    vi.mocked(listAccountBalanceAdjustments).mockResolvedValue({
      data: adjustments,
      status: 200,
      headers: new Headers(),
    } as never);

    await expect(listBalanceAdjustmentsData("account-1")).resolves.toBe(adjustments);
    expect(listAccountBalanceAdjustments).toHaveBeenCalledWith("account-1");
  });

  it("throws ApiError for an unexpected status and preserves API errors", async () => {
    vi.mocked(listAccountBalanceAdjustments).mockResolvedValue({
      data: { message: "invalid" },
      status: 400,
      headers: new Headers(),
    } as never);
    await expect(listBalanceAdjustmentsData("account-1")).rejects.toBeInstanceOf(ApiError);

    const error = new ApiError(503, { message: "offline" });
    vi.mocked(listAccountBalanceAdjustments).mockRejectedValue(error);
    await expect(listBalanceAdjustmentsData("account-1")).rejects.toBe(error);
  });
});
