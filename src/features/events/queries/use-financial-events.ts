"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { FinancialEvent, ListFinancialEventsParams } from "@/api/generated/client";
import { listFinancialEventsData } from "@/features/events/api/financial-events";
import { ApiError } from "@/lib/http";

export function financialEventsQueryKey(filters: ListFinancialEventsParams) {
  return ["financial-events", filters] as const;
}

export function useFinancialEvents(filters: ListFinancialEventsParams) {
  return useQuery<FinancialEvent[], ApiError>({
    queryKey: financialEventsQueryKey(filters),
    queryFn: () => listFinancialEventsData(filters),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
