import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/credit-cards/api/pay-credit-card-invoice", () => ({
  payCreditCardInvoiceData: vi.fn(),
}));

import { payCreditCardInvoiceData } from "@/features/wallet/credit-cards/api/pay-credit-card-invoice";
import { usePayCreditCardInvoice } from "@/features/wallet/credit-cards/mutations/use-pay-credit-card-invoice";

afterEach(() => {
  vi.resetAllMocks();
});

describe("usePayCreditCardInvoice", () => {
  it("invalidates financial projections and the created banking transaction views", async () => {
    vi.mocked(payCreditCardInvoiceData).mockResolvedValue({ id: "invoice-1" } as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const setQueryData = vi.spyOn(queryClient, "setQueryData");
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => usePayCreditCardInvoice(), { wrapper });

    await result.current.mutateAsync({ id: "invoice-1", payload: { accountId: "account-1" } });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["credit-card-invoices"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["credit-card-purchases"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["monthly-summary"] });
    expect(setQueryData).not.toHaveBeenCalled();
  });
});
