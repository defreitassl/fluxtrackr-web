"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { ListTransactionsParams, Transaction } from "@/api/generated/client";
import { listTransactionsData } from "@/features/transactions/api/transactions";
import { ApiError } from "@/lib/http";

export function transactionsQueryKey(filters: ListTransactionsParams) { return ["transactions", filters] as const; }
export function useTransactions(filters: ListTransactionsParams) { return useQuery<Transaction[], ApiError>({ queryKey: transactionsQueryKey(filters), queryFn: () => listTransactionsData(filters), placeholderData: keepPreviousData, retry: false }); }
