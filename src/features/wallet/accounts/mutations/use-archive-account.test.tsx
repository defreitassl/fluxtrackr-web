import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/accounts/api/archive-account", () => ({
  archiveAccountData: vi.fn(),
}));

import { archiveAccountData } from "@/features/wallet/accounts/api/archive-account";
import { useArchiveAccount } from "@/features/wallet/accounts/mutations/use-archive-account";

afterEach(() => {
  vi.resetAllMocks();
});

describe("useArchiveAccount", () => {
  it("invalidates every affected query without optimistic cache writes", async () => {
    vi.mocked(archiveAccountData).mockResolvedValue({ archived: true } as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const setQueryData = vi.spyOn(queryClient, "setQueryData");
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useArchiveAccount(), { wrapper });

    await result.current.mutateAsync("account-1");

    expect(archiveAccountData).toHaveBeenCalledTimes(1);
    expect(vi.mocked(archiveAccountData).mock.calls[0]?.[0]).toBe("account-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["transaction-accounts"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["balance-forecast"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
    expect(setQueryData).not.toHaveBeenCalled();
  });
});
