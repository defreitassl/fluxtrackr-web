import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/transfers/api/create-account-transfer", () => ({
  createAccountTransferData: vi.fn(),
}));

import { createAccountTransferData } from "@/features/wallet/transfers/api/create-account-transfer";
import { useCreateAccountTransfer } from "@/features/wallet/transfers/mutations/use-create-account-transfer";

afterEach(() => vi.resetAllMocks());

describe("useCreateAccountTransfer", () => {
  it("invalidates all dependent views without optimistic cache writes", async () => {
    vi.mocked(createAccountTransferData).mockResolvedValue({ id: "transfer-1" } as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const setQueryData = vi.spyOn(queryClient, "setQueryData");
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useCreateAccountTransfer(), { wrapper });

    await result.current.mutateAsync({ sourceAccountId: "source", destinationAccountId: "destination", amount: "250.00" });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["account-transfers"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
    expect(setQueryData).not.toHaveBeenCalled();
  });
});
