"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  ArchivedResponse,
  CreateFixedExpenseRequest,
  CreateFixedIncomeRequest,
  CreateSubscriptionRequest,
  FixedExpense,
  FixedIncome,
  FixedOccurrence,
  RealizeFixedOccurrenceRequest,
  RealizeFixedOccurrenceResponse,
  RealizeSubscriptionChargeRequest,
  RealizeSubscriptionChargeResponse,
  Subscription,
  SubscriptionCharge,
  UpdateFixedExpenseRequest,
  UpdateFixedIncomeRequest,
  UpdateSubscriptionRequest,
} from "@/api/generated/client";
import {
  archiveFixedExpenseData,
  archiveFixedIncomeData,
  cancelFixedOccurrenceData,
  createFixedExpenseData,
  createFixedIncomeData,
  realizeFixedOccurrenceData,
  updateFixedExpenseData,
  updateFixedIncomeData,
} from "@/features/recurrences/api/fixed";
import {
  archiveSubscriptionData,
  cancelSubscriptionChargeData,
  createSubscriptionData,
  realizeSubscriptionChargeData,
  updateSubscriptionData,
} from "@/features/recurrences/api/subscriptions";
import { ApiError } from "@/lib/http";

type QueryClient = ReturnType<typeof useQueryClient>;

async function invalidateSubscriptionQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
    queryClient.invalidateQueries({ queryKey: ["subscriptions-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["subscription-charges"] }),
    queryClient.invalidateQueries({ queryKey: ["financial-timeline"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
    queryClient.invalidateQueries({ queryKey: ["balance-forecast"] }),
  ]);
}

async function invalidateFixedQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] }),
    queryClient.invalidateQueries({ queryKey: ["fixed-incomes"] }),
    queryClient.invalidateQueries({ queryKey: ["fixed-occurrences"] }),
    queryClient.invalidateQueries({ queryKey: ["monthly-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["financial-timeline"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
    queryClient.invalidateQueries({ queryKey: ["balance-forecast"] }),
  ]);
}

async function invalidateRealizedChargeQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateSubscriptionQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["monthly-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
    queryClient.invalidateQueries({ queryKey: ["credit-card-purchases"] }),
    queryClient.invalidateQueries({ queryKey: ["credit-card-invoices"] }),
  ]);
}

async function invalidateRealizedOccurrenceQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateFixedQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
  ]);
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation<Subscription, ApiError, CreateSubscriptionRequest>({
    mutationFn: createSubscriptionData,
    onSuccess: () => invalidateSubscriptionQueries(queryClient),
  });
}

export type UpdateSubscriptionVariables = { id: string; payload: UpdateSubscriptionRequest };

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation<Subscription, ApiError, UpdateSubscriptionVariables>({
    mutationFn: ({ id, payload }) => updateSubscriptionData(id, payload),
    onSuccess: () => invalidateSubscriptionQueries(queryClient),
  });
}

export function useArchiveSubscription() {
  const queryClient = useQueryClient();
  return useMutation<ArchivedResponse, ApiError, string>({
    mutationFn: archiveSubscriptionData,
    onSuccess: () => invalidateSubscriptionQueries(queryClient),
  });
}

export type RealizeSubscriptionChargeVariables = {
  id: string;
  payload: RealizeSubscriptionChargeRequest;
};

export function useRealizeSubscriptionCharge() {
  const queryClient = useQueryClient();
  return useMutation<RealizeSubscriptionChargeResponse, ApiError, RealizeSubscriptionChargeVariables>({
    mutationFn: ({ id, payload }) => realizeSubscriptionChargeData(id, payload),
    onSuccess: () => invalidateRealizedChargeQueries(queryClient),
  });
}

export function useCancelSubscriptionCharge() {
  const queryClient = useQueryClient();
  return useMutation<SubscriptionCharge, ApiError, string>({
    mutationFn: cancelSubscriptionChargeData,
    onSuccess: () => invalidateSubscriptionQueries(queryClient),
  });
}

export function useCreateFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<FixedExpense, ApiError, CreateFixedExpenseRequest>({
    mutationFn: createFixedExpenseData,
    onSuccess: () => invalidateFixedQueries(queryClient),
  });
}

export function useCreateFixedIncome() {
  const queryClient = useQueryClient();
  return useMutation<FixedIncome, ApiError, CreateFixedIncomeRequest>({
    mutationFn: createFixedIncomeData,
    onSuccess: () => invalidateFixedQueries(queryClient),
  });
}

export type UpdateFixedExpenseVariables = { id: string; payload: UpdateFixedExpenseRequest };
export type UpdateFixedIncomeVariables = { id: string; payload: UpdateFixedIncomeRequest };

export function useUpdateFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<FixedExpense, ApiError, UpdateFixedExpenseVariables>({
    mutationFn: ({ id, payload }) => updateFixedExpenseData(id, payload),
    onSuccess: () => invalidateFixedQueries(queryClient),
  });
}

export function useUpdateFixedIncome() {
  const queryClient = useQueryClient();
  return useMutation<FixedIncome, ApiError, UpdateFixedIncomeVariables>({
    mutationFn: ({ id, payload }) => updateFixedIncomeData(id, payload),
    onSuccess: () => invalidateFixedQueries(queryClient),
  });
}

export function useArchiveFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<ArchivedResponse, ApiError, string>({
    mutationFn: archiveFixedExpenseData,
    onSuccess: () => invalidateFixedQueries(queryClient),
  });
}

export function useArchiveFixedIncome() {
  const queryClient = useQueryClient();
  return useMutation<ArchivedResponse, ApiError, string>({
    mutationFn: archiveFixedIncomeData,
    onSuccess: () => invalidateFixedQueries(queryClient),
  });
}

export type RealizeFixedOccurrenceVariables = { id: string; payload: RealizeFixedOccurrenceRequest };

export function useRealizeFixedOccurrence() {
  const queryClient = useQueryClient();
  return useMutation<RealizeFixedOccurrenceResponse, ApiError, RealizeFixedOccurrenceVariables>({
    mutationFn: ({ id, payload }) => realizeFixedOccurrenceData(id, payload),
    onSuccess: () => invalidateRealizedOccurrenceQueries(queryClient),
  });
}

export function useCancelFixedOccurrence() {
  const queryClient = useQueryClient();
  return useMutation<FixedOccurrence, ApiError, string>({
    mutationFn: cancelFixedOccurrenceData,
    onSuccess: () => invalidateFixedQueries(queryClient),
  });
}
