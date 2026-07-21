import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/credit-cards/api/create-credit-card-purchase", () => ({
  createCreditCardPurchaseData: vi.fn(),
}));

import { createCreditCardPurchaseData } from "@/features/wallet/credit-cards/api/create-credit-card-purchase";
import { useCreateCreditCardPurchase } from "@/features/wallet/credit-cards/mutations/use-create-credit-card-purchase";

afterEach(() => {
  vi.resetAllMocks();
});

describe("useCreateCreditCardPurchase", () => {
  it("awaits every affected API-backed query without optimistic cache writes", async () => {
    vi.mocked(createCreditCardPurchaseData).mockResolvedValue({ id: "purchase-1" } as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const setQueryData = vi.spyOn(queryClient, "setQueryData");
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateCreditCardPurchase(), { wrapper });

    await result.current.mutateAsync({} as never);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["credit-card-purchases"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["credit-card-invoices"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["category-budget-overview"] });
    expect(setQueryData).not.toHaveBeenCalled();
  });
});
