import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  listAccountBalanceAdjustments: vi.fn(),
  listAccountTransfers: vi.fn(),
}));

import {
  listAccountBalanceAdjustments,
  listAccountTransfers,
} from "@/api/generated/client";
import {
  listAccountBalanceAdjustmentsData,
  listAccountTransfersData,
} from "@/features/wallet/history/api/account-history";
import { ApiError } from "@/lib/http";

afterEach(() => vi.resetAllMocks());

describe("account history API adapters", () => {
  it("filters transfers by accountId, which includes incoming and outgoing transfers", async () => {
    const transfers = [{ id: "transfer-1" }];
    vi.mocked(listAccountTransfers).mockResolvedValue({ status: 200, data: transfers } as never);

    await expect(listAccountTransfersData({ accountId: "account-1" })).resolves.toBe(transfers);
    expect(listAccountTransfers).toHaveBeenCalledWith({ accountId: "account-1" });
  });

  it("unwraps account balance adjustments by account id", async () => {
    const adjustments = [{ id: "adjustment-1" }];
    vi.mocked(listAccountBalanceAdjustments).mockResolvedValue({ status: 200, data: adjustments } as never);

    await expect(listAccountBalanceAdjustmentsData("account-1")).resolves.toBe(adjustments);
    expect(listAccountBalanceAdjustments).toHaveBeenCalledWith("account-1");
  });

  it("turns unexpected responses into ApiError and preserves request failures", async () => {
    vi.mocked(listAccountTransfers).mockResolvedValue({ status: 400, data: { message: "invalid" } } as never);
    await expect(listAccountTransfersData({ accountId: "account-1" })).rejects.toBeInstanceOf(ApiError);

    const error = new ApiError(503, { message: "offline" });
    vi.mocked(listAccountBalanceAdjustments).mockRejectedValue(error);
    await expect(listAccountBalanceAdjustmentsData("account-1")).rejects.toBe(error);
  });
});
