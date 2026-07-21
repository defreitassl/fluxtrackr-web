"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { ListTransactionsParams, Transaction } from "@/api/generated/client";
import { listTransactionsData } from "@/features/transactions/api/transactions";
import { ApiError } from "@/lib/http";

export function transactionsQueryKey(filters: ListTransactionsParams) { return ["transactions", filters] as const; }

const disabledTransactionsQueryKey = ["transactions", "disabled"] as const;

type UseTransactionsOptions = {
  enabled?: boolean;
};

export function useTransactions(filters: ListTransactionsParams | null, { enabled = true }: UseTransactionsOptions = {}) {
  const canFetch = enabled && filters !== null;

  return useQuery<Transaction[], ApiError>({
    queryKey: filters ? transactionsQueryKey(filters) : disabledTransactionsQueryKey,
    queryFn: () => {
      if (!filters) {
        throw new Error("A consulta de transações requer filtros válidos.");
      }

      return listTransactionsData(filters);
    },
    enabled: canFetch,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
