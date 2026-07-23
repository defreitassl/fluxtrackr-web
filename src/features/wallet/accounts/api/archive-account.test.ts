import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({ archiveAccount: vi.fn() }));

import { archiveAccount } from "@/api/generated/client";
import { archiveAccountData } from "@/features/wallet/accounts/api/archive-account";
import { ApiError } from "@/lib/http";

afterEach(() => {
  vi.resetAllMocks();
});

describe("archiveAccountData", () => {
  it("returns the archive confirmation for a 200 response and forwards the id", async () => {
    const archived = { archived: true } as const;
    vi.mocked(archiveAccount).mockResolvedValue({
      data: archived,
      status: 200,
      headers: new Headers(),
    } as never);

    await expect(archiveAccountData("account-1")).resolves.toEqual(archived);
    expect(archiveAccount).toHaveBeenCalledWith("account-1");
  });

  it("throws ApiError when the status is not 200", async () => {
    vi.mocked(archiveAccount).mockResolvedValue({
      data: { message: "not found" },
      status: 404,
      headers: new Headers(),
    } as never);

    await expect(archiveAccountData("account-1")).rejects.toBeInstanceOf(ApiError);
  });

  it("preserves an ApiError raised by the HTTP client", async () => {
    const error = new ApiError(503, { message: "Serviço indisponível." });
    vi.mocked(archiveAccount).mockRejectedValue(error);

    await expect(archiveAccountData("account-1")).rejects.toBe(error);
  });
});
