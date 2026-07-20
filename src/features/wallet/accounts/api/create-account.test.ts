import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({ createAccount: vi.fn() }));

import { createAccount } from "@/api/generated/client";
import { createAccountData } from "@/features/wallet/accounts/api/create-account";
import { ApiError } from "@/lib/http";

afterEach(() => {
  vi.resetAllMocks();
});

const account = { id: "a1", name: "Conta" };

describe("createAccountData", () => {
  it("returns only the Account for a 201 response", async () => {
    vi.mocked(createAccount).mockResolvedValue({
      data: account,
      status: 201,
      headers: new Headers(),
    } as never);

    await expect(createAccountData({} as never)).resolves.toEqual(account);
  });

  it("throws ApiError when the status is not 201", async () => {
    vi.mocked(createAccount).mockResolvedValue({
      data: { message: "conflict" },
      status: 409,
      headers: new Headers(),
    } as never);

    await expect(createAccountData({} as never)).rejects.toBeInstanceOf(ApiError);
  });

  it("preserves an ApiError raised by the HTTP client", async () => {
    const error = new ApiError(503, { message: "Serviço indisponível." });
    vi.mocked(createAccount).mockRejectedValue(error);

    await expect(createAccountData({} as never)).rejects.toBe(error);
  });
});
