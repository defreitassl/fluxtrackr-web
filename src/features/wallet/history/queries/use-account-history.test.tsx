import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/history/api/account-history", () => ({
  listAccountBalanceAdjustmentsData: vi.fn(),
  listAccountTransfersData: vi.fn(),
}));

import {
  listAccountBalanceAdjustmentsData,
  listAccountTransfersData,
} from "@/features/wallet/history/api/account-history";
import {
  accountBalanceAdjustmentsQueryKey,
  accountTransfersQueryKey,
  useAccountHistory,
} from "@/features/wallet/history/queries/use-account-history";

afterEach(() => vi.resetAllMocks());

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useAccountHistory", () => {
  it("uses account-scoped cache keys that match the existing adjustment invalidation", async () => {
    const transfers = [{
      id: "transfer-1",
      sourceAccountId: "account-1",
      destinationAccountId: "account-2",
      occurredAt: "2026-07-01T12:00:00.000Z",
    }];
    const adjustments = [{
      id: "adjustment-1",
      accountId: "account-1",
      occurredAt: "2026-07-02T12:00:00.000Z",
    }];
    vi.mocked(listAccountTransfersData).mockResolvedValue(transfers as never);
    vi.mocked(listAccountBalanceAdjustmentsData).mockResolvedValue(adjustments as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAccountHistory("account-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(accountTransfersQueryKey("account-1")).toEqual(["account-transfers", { accountId: "account-1" }]);
    expect(accountBalanceAdjustmentsQueryKey("account-1")).toEqual([
      "account-balance-adjustments",
      { accountId: "account-1" },
    ]);
    expect(listAccountTransfersData).toHaveBeenCalledWith({ accountId: "account-1" });
    expect(listAccountBalanceAdjustmentsData).toHaveBeenCalledWith("account-1");
    expect(result.current.data.map((entry) => entry.type)).toEqual(["adjustment", "transfer_out"]);
  });

  it("does not issue requests before a drawer has an account", () => {
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useAccountHistory(null), { wrapper });

    expect(listAccountTransfersData).not.toHaveBeenCalled();
    expect(listAccountBalanceAdjustmentsData).not.toHaveBeenCalled();
    expect(result.current.transfers.fetchStatus).toBe("idle");
    expect(result.current.adjustments.fetchStatus).toBe("idle");
    expect(queryClient.getQueryCache().find({ exact: true, queryKey: ["account-transfers", "disabled"] })?.queryKey).toEqual([
      "account-transfers",
      "disabled",
    ]);
  });
});
