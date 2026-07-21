"use client";

import { useQuery } from "@tanstack/react-query";

import type { MonthlySummary } from "@/api/generated/client";
import { getTransactionMonthlySummaryData } from "@/features/transactions/api/transactions";
import { ApiError } from "@/lib/http";

export type TransactionSummaryPeriod = {
  year: number;
  month: number;
};

export function transactionMonthlySummaryQueryKey({ year, month }: TransactionSummaryPeriod) {
  return ["monthly-summary", { year, month }] as const;
}

export function useTransactionMonthlySummary(
  period: TransactionSummaryPeriod,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery<MonthlySummary, ApiError>({
    enabled,
    queryKey: transactionMonthlySummaryQueryKey(period),
    queryFn: () => getTransactionMonthlySummaryData(period.year, period.month),
    retry: false,
  });
}
