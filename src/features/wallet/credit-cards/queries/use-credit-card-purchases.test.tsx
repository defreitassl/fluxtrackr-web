import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/credit-cards/api/list-credit-card-purchases", () => ({
  listCreditCardPurchasesData: vi.fn(),
}));

import { listCreditCardPurchasesData } from "@/features/wallet/credit-cards/api/list-credit-card-purchases";
import {
  creditCardPurchasesQueryKey,
  useCreditCardPurchases,
} from "@/features/wallet/credit-cards/queries/use-credit-card-purchases";

afterEach(() => vi.resetAllMocks());

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useCreditCardPurchases", () => {
  it("fetches only purchases from the selected card with an account-specific cache key", async () => {
    const purchases = [{ id: "purchase-1", installments: [] }];
    vi.mocked(listCreditCardPurchasesData).mockResolvedValue(purchases as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreditCardPurchases("card-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(creditCardPurchasesQueryKey("card-1")).toEqual([
      "credit-card-purchases",
      { creditCardId: "card-1" },
    ]);
    expect(listCreditCardPurchasesData).toHaveBeenCalledWith({ creditCardId: "card-1" });
    expect(result.current.data).toEqual(purchases);
  });

  it("keeps the query disabled until a credit card is selected", () => {
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useCreditCardPurchases(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(listCreditCardPurchasesData).not.toHaveBeenCalled();
    expect(queryClient.getQueryCache().find({ exact: true, queryKey: ["credit-card-purchases", "disabled"] })?.queryKey).toEqual([
      "credit-card-purchases",
      "disabled",
    ]);
  });
});
