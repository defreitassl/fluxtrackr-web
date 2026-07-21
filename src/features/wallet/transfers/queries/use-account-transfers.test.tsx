import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/transfers/api/list-account-transfers", () => ({ listAccountTransfersData: vi.fn() }));

import { listAccountTransfersData } from "@/features/wallet/transfers/api/list-account-transfers";
import { accountTransfersQueryKey, useAccountTransfers } from "@/features/wallet/transfers/queries/use-account-transfers";

afterEach(() => vi.resetAllMocks());

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}

describe("useAccountTransfers", () => {
  it("does not request without an account and uses the isolated account key", async () => {
    renderHook(() => useAccountTransfers(null), { wrapper });
    expect(listAccountTransfersData).not.toHaveBeenCalled();

    vi.mocked(listAccountTransfersData).mockResolvedValue([]);
    const { result } = renderHook(() => useAccountTransfers("account-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountTransfersQueryKey("account-1")).toEqual(["account-transfers", { accountId: "account-1" }]);
    expect(listAccountTransfersData).toHaveBeenCalledWith({ accountId: "account-1" });
  });
});
