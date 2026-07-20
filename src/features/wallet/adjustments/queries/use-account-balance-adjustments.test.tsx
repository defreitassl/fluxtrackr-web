import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/adjustments/api/list-balance-adjustments", () => ({
  listBalanceAdjustmentsData: vi.fn(),
}));

import { listBalanceAdjustmentsData } from "@/features/wallet/adjustments/api/list-balance-adjustments";
import {
  accountBalanceAdjustmentsQueryKey,
  useAccountBalanceAdjustments,
} from "@/features/wallet/adjustments/queries/use-account-balance-adjustments";

afterEach(() => {
  vi.resetAllMocks();
});

function wrapper({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useAccountBalanceAdjustments", () => {
  it("does not request history without an account id", () => {
    renderHook(() => useAccountBalanceAdjustments(null), { wrapper });
    expect(listBalanceAdjustmentsData).not.toHaveBeenCalled();
  });

  it("uses the selected account query key", async () => {
    vi.mocked(listBalanceAdjustmentsData).mockResolvedValue([]);
    const { result } = renderHook(() => useAccountBalanceAdjustments("account-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountBalanceAdjustmentsQueryKey("account-1")).toEqual([
      "account-balance-adjustments",
      "account-1",
    ]);
    expect(listBalanceAdjustmentsData).toHaveBeenCalledWith("account-1");
  });
});
