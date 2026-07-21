import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/adjustments/api/create-balance-adjustment", () => ({
  createBalanceAdjustmentData: vi.fn(),
}));

import { createBalanceAdjustmentData } from "@/features/wallet/adjustments/api/create-balance-adjustment";
import { useCreateBalanceAdjustment } from "@/features/wallet/adjustments/mutations/use-create-balance-adjustment";

afterEach(() => {
  vi.resetAllMocks();
});

describe("useCreateBalanceAdjustment", () => {
  it("awaits all required invalidations without optimistic cache writes", async () => {
    vi.mocked(createBalanceAdjustmentData).mockResolvedValue({
      adjustment: { id: "adjustment-1", accountId: "account-1" },
      currentBalance: "1500.00",
    } as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const setQueryData = vi.spyOn(queryClient, "setQueryData");
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateBalanceAdjustment(), { wrapper });

    await result.current.mutateAsync({ accountId: "account-1", payload: { newBalance: "1500.00" } });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["account-balance-adjustments", { accountId: "account-1" }] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
    expect(setQueryData).not.toHaveBeenCalled();
  });
});
