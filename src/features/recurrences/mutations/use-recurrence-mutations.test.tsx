import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/recurrences/api/subscriptions", () => ({
  archiveSubscriptionData: vi.fn(),
  cancelSubscriptionChargeData: vi.fn(),
  createSubscriptionData: vi.fn(),
  realizeSubscriptionChargeData: vi.fn(),
  updateSubscriptionData: vi.fn(),
}));

vi.mock("@/features/recurrences/api/fixed", () => ({
  archiveFixedExpenseData: vi.fn(),
  archiveFixedIncomeData: vi.fn(),
  cancelFixedOccurrenceData: vi.fn(),
  createFixedExpenseData: vi.fn(),
  createFixedIncomeData: vi.fn(),
  realizeFixedOccurrenceData: vi.fn(),
  updateFixedExpenseData: vi.fn(),
  updateFixedIncomeData: vi.fn(),
}));

import {
  realizeFixedOccurrenceData,
} from "@/features/recurrences/api/fixed";
import {
  realizeSubscriptionChargeData,
} from "@/features/recurrences/api/subscriptions";
import {
  useRealizeFixedOccurrence,
  useRealizeSubscriptionCharge,
} from "@/features/recurrences/mutations/use-recurrence-mutations";

afterEach(() => vi.resetAllMocks());

function testClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper(queryClient: QueryClient) {
  function RecurrenceMutationQueryWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return RecurrenceMutationQueryWrapper;
}

describe("recurrence realization mutations", () => {
  it("invalidates all transaction and card dependents after realizing a subscription charge", async () => {
    vi.mocked(realizeSubscriptionChargeData).mockResolvedValue({ charge: { id: "charge-1" } } as never);
    const queryClient = testClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const { result } = renderHook(() => useRealizeSubscriptionCharge(), { wrapper: wrapper(queryClient) });

    await result.current.mutateAsync({ id: "charge-1", payload: {} });

    for (const queryKey of [
      ["subscriptions"], ["subscriptions-summary"], ["subscription-charges"], ["financial-timeline"], ["dashboard-overview"], ["balance-forecast"],
      ["transactions"], ["monthly-summary"], ["wallet-overview"], ["credit-card-purchases"], ["credit-card-invoices"],
    ]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey });
    }
  });

  it("does not invalidate card purchases or invoices after realizing a fixed occurrence", async () => {
    vi.mocked(realizeFixedOccurrenceData).mockResolvedValue({ occurrence: { id: "occurrence-1" }, transaction: { id: "transaction-1" } } as never);
    const queryClient = testClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const { result } = renderHook(() => useRealizeFixedOccurrence(), { wrapper: wrapper(queryClient) });

    await result.current.mutateAsync({ id: "occurrence-1", payload: { accountId: "account-1", paymentMethod: "pix" } });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["credit-card-purchases"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["credit-card-invoices"] });
  });
});
