import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/events/api/financial-events", () => ({
  cancelFinancialEventData: vi.fn(),
  confirmFinancialEventData: vi.fn(),
  createFinancialEventData: vi.fn(),
  postponeFinancialEventData: vi.fn(),
  realizeFinancialEventData: vi.fn(),
  updateFinancialEventData: vi.fn(),
}));

import {
  createFinancialEventData,
  realizeFinancialEventData,
} from "@/features/events/api/financial-events";
import {
  useCreateFinancialEvent,
  useRealizeFinancialEvent,
} from "@/features/events/mutations/use-financial-event-mutations";

afterEach(() => vi.resetAllMocks());

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { invalidate, wrapper };
}

describe("useCreateFinancialEvent", () => {
  it("invalidates only projection caches (no realized movements)", async () => {
    vi.mocked(createFinancialEventData).mockResolvedValue({ id: "event-1" } as never);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateFinancialEvent(), { wrapper });

    await result.current.mutateAsync({
      type: "expense",
      name: "IPVA",
      expectedAmount: 1200.5,
      date: "2026-08-01T12:00:00.000Z",
      accountId: "account-1",
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-events"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["balance-forecast"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
  });
});

describe("useRealizeFinancialEvent", () => {
  it("also invalidates the caches of the created movements", async () => {
    vi.mocked(realizeFinancialEventData).mockResolvedValue({
      event: { id: "event-1", status: "realized" },
      transaction: { id: "transaction-1" },
      creditCardPurchase: null,
      nextEvent: null,
    } as never);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useRealizeFinancialEvent(), { wrapper });

    await result.current.mutateAsync("event-1");

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-events"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["financial-timeline"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["balance-forecast"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["monthly-summary"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["wallet-overview"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["credit-card-purchases"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["credit-card-invoices"] });
  });
});
