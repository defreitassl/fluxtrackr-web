import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({ createAccountTransfer: vi.fn() }));

import { createAccountTransfer } from "@/api/generated/client";
import { createAccountTransferData } from "@/features/wallet/transfers/api/create-account-transfer";
import { ApiError } from "@/lib/http";

const payload = { sourceAccountId: "source", destinationAccountId: "destination", amount: "250.00" };
const transfer = { id: "transfer", ...payload, userId: "user", description: null, occurredAt: "2026-07-20T12:00:00.000Z", createdAt: "2026-07-20T12:00:00.000Z", updatedAt: "2026-07-20T12:00:00.000Z" };

describe("createAccountTransferData", () => {
  it("expects 201 and returns only the transfer", async () => {
    vi.mocked(createAccountTransfer).mockResolvedValue({ status: 201, data: transfer } as never);
    await expect(createAccountTransferData(payload)).resolves.toEqual(transfer);
    expect(createAccountTransfer).toHaveBeenCalledWith(payload);
  });

  it("preserves ApiError and turns unexpected statuses into it", async () => {
    const error = new ApiError(503, {});
    vi.mocked(createAccountTransfer).mockRejectedValue(error);
    await expect(createAccountTransferData(payload)).rejects.toBe(error);
    vi.mocked(createAccountTransfer).mockResolvedValue({ status: 400, data: { message: "invalid" } } as never);
    await expect(createAccountTransferData(payload)).rejects.toMatchObject({ status: 400 });
  });
});
