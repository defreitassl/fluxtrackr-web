"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  CreateFinancialEventRequest,
  FinancialEvent,
  PostponeFinancialEventRequest,
  RealizeFinancialEventResponse,
  UpdateFinancialEventRequest,
} from "@/api/generated/client";
import {
  cancelFinancialEventData,
  confirmFinancialEventData,
  createFinancialEventData,
  postponeFinancialEventData,
  realizeFinancialEventData,
  updateFinancialEventData,
} from "@/features/events/api/financial-events";
import { ApiError } from "@/lib/http";

const baseInvalidatedKeys = [
  ["financial-events"],
  ["financial-timeline"],
  ["dashboard-overview"],
  ["balance-forecast"],
];

/** Realizar cria Transaction/CreditCardPurchase — invalida também esses caches. */
const realizeInvalidatedKeys = [
  ...baseInvalidatedKeys,
  ["transactions"],
  ["monthly-summary"],
  ["wallet-overview"],
  ["credit-card-purchases"],
  ["credit-card-invoices"],
];

function invalidateKeys(queryClient: ReturnType<typeof useQueryClient>, keys: string[][]) {
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useCreateFinancialEvent() {
  const queryClient = useQueryClient();

  return useMutation<FinancialEvent, ApiError, CreateFinancialEventRequest>({
    mutationFn: createFinancialEventData,
    onSuccess: () => invalidateKeys(queryClient, baseInvalidatedKeys),
  });
}

export type UpdateFinancialEventVariables = {
  id: string;
  payload: UpdateFinancialEventRequest;
};

export function useUpdateFinancialEvent() {
  const queryClient = useQueryClient();

  return useMutation<FinancialEvent, ApiError, UpdateFinancialEventVariables>({
    mutationFn: ({ id, payload }) => updateFinancialEventData(id, payload),
    onSuccess: () => invalidateKeys(queryClient, baseInvalidatedKeys),
  });
}

export function useConfirmFinancialEvent() {
  const queryClient = useQueryClient();

  return useMutation<FinancialEvent, ApiError, string>({
    mutationFn: confirmFinancialEventData,
    onSuccess: () => invalidateKeys(queryClient, baseInvalidatedKeys),
  });
}

export type PostponeFinancialEventVariables = {
  id: string;
  payload: PostponeFinancialEventRequest;
};

export function usePostponeFinancialEvent() {
  const queryClient = useQueryClient();

  return useMutation<FinancialEvent, ApiError, PostponeFinancialEventVariables>({
    mutationFn: ({ id, payload }) => postponeFinancialEventData(id, payload),
    onSuccess: () => invalidateKeys(queryClient, baseInvalidatedKeys),
  });
}

export function useCancelFinancialEvent() {
  const queryClient = useQueryClient();

  return useMutation<FinancialEvent, ApiError, string>({
    mutationFn: cancelFinancialEventData,
    onSuccess: () => invalidateKeys(queryClient, baseInvalidatedKeys),
  });
}

export function useRealizeFinancialEvent() {
  const queryClient = useQueryClient();

  return useMutation<RealizeFinancialEventResponse, ApiError, string>({
    mutationFn: realizeFinancialEventData,
    onSuccess: () => invalidateKeys(queryClient, realizeInvalidatedKeys),
  });
}
