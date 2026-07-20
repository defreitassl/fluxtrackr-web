import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({ updateAccount: vi.fn() }));

import { updateAccount } from "@/api/generated/client";
import { updateAccountData } from "@/features/wallet/accounts/api/update-account";
import { ApiError } from "@/lib/http";

afterEach(() => {
  vi.resetAllMocks();
});

const account = { id: "a1", name: "Conta atualizada" };

describe("updateAccountData", () => {
  it("returns only the Account for a 200 response and forwards id/payload", async () => {
    vi.mocked(updateAccount).mockResolvedValue({
      data: account,
      status: 200,
      headers: new Headers(),
    } as never);

    await expect(updateAccountData("a1", { name: "Conta atualizada" })).resolves.toEqual(account);
    expect(updateAccount).toHaveBeenCalledWith("a1", { name: "Conta atualizada" });
  });

  it("throws ApiError when the status is not 200", async () => {
    vi.mocked(updateAccount).mockResolvedValue({
      data: { message: "conflict" },
      status: 409,
      headers: new Headers(),
    } as never);

    await expect(updateAccountData("a1", {})).rejects.toBeInstanceOf(ApiError);
  });

  it("preserves an ApiError raised by the HTTP client", async () => {
    const error = new ApiError(503, { message: "Serviço indisponível." });
    vi.mocked(updateAccount).mockRejectedValue(error);

    await expect(updateAccountData("a1", {})).rejects.toBe(error);
  });
});
