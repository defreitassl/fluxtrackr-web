import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/transactions/api/transactions", () => ({
  getTransactionMonthlySummaryData: vi.fn(),
}));

import { getTransactionMonthlySummaryData } from "@/features/transactions/api/transactions";
import {
  transactionMonthlySummaryQueryKey,
  useTransactionMonthlySummary,
} from "@/features/transactions/queries/use-monthly-summary";

afterEach(() => vi.resetAllMocks());

describe("useTransactionMonthlySummary", () => {
  it("uses the selected year and month in both the query key and API request", async () => {
    vi.mocked(getTransactionMonthlySummaryData).mockResolvedValue({
      year: 2026,
      month: 8,
      transactionIncomeTotal: 0,
      transactionExpenseTotal: 0,
      availableBalance: 0,
    } as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useTransactionMonthlySummary({ year: 2026, month: 8 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(transactionMonthlySummaryQueryKey({ year: 2026, month: 8 })).toEqual([
      "monthly-summary",
      { year: 2026, month: 8 },
    ]);
    expect(getTransactionMonthlySummaryData).toHaveBeenCalledWith(2026, 8);
  });
});
