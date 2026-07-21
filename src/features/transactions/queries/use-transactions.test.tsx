import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/transactions/api/transactions", () => ({
  listTransactionsData: vi.fn(),
}));

import { listTransactionsData } from "@/features/transactions/api/transactions";
import { transactionsQueryKey, useTransactions } from "@/features/transactions/queries/use-transactions";

afterEach(() => vi.resetAllMocks());

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { queryClient, wrapper };
}

describe("useTransactions", () => {
  it("does not request transactions when filters are invalid/disabled", () => {
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useTransactions(null, { enabled: false }), { wrapper });

    expect(listTransactionsData).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
    expect(queryClient.getQueryCache().find({ exact: true, queryKey: ["transactions", "disabled"] })?.queryKey).toEqual(["transactions", "disabled"]);
  });

  it("requests valid filters with their own query key", async () => {
    vi.mocked(listTransactionsData).mockResolvedValue([]);
    const { wrapper } = createWrapper();
    const filters = { type: "expense" as const };
    const { result } = renderHook(() => useTransactions(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionsQueryKey(filters)).toEqual(["transactions", filters]);
    expect(listTransactionsData).toHaveBeenCalledWith(filters);
  });

  it("keeps the prior valid data visible while an invalid interval disables the query", async () => {
    const transactions = [{ id: "transaction-1" }];
    vi.mocked(listTransactionsData).mockResolvedValue(transactions as never);
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ filters, enabled }: { filters: { type: "income" } | null; enabled: boolean }) => useTransactions(filters, { enabled }),
      {
        initialProps: { filters: { type: "income" as const }, enabled: true } as {
          filters: { type: "income" } | null;
          enabled: boolean;
        },
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.data).toEqual(transactions));
    rerender({ filters: null, enabled: false });

    expect(result.current.data).toEqual(transactions);
    expect(listTransactionsData).toHaveBeenCalledTimes(1);
  });
});
