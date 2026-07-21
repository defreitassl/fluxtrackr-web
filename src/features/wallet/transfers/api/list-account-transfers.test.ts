import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({ listAccountTransfers: vi.fn() }));

import { listAccountTransfers } from "@/api/generated/client";
import { listAccountTransfersData } from "@/features/wallet/transfers/api/list-account-transfers";
import { ApiError } from "@/lib/http";

describe("listAccountTransfersData", () => {
  it("expects 200, forwards accountId and preserves API order", async () => {
    const transfers = [{ id: "new" }, { id: "old" }];
    vi.mocked(listAccountTransfers).mockResolvedValue({ status: 200, data: transfers } as never);
    await expect(listAccountTransfersData({ accountId: "account-1" })).resolves.toEqual(transfers);
    expect(listAccountTransfers).toHaveBeenCalledWith({ accountId: "account-1" });
  });

  it("preserves ApiError", async () => {
    const error = new ApiError(503, {});
    vi.mocked(listAccountTransfers).mockRejectedValue(error);
    await expect(listAccountTransfersData({ accountId: "account-1" })).rejects.toBe(error);
  });
});
