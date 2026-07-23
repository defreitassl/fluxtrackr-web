"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type {
  FixedExpense,
  FixedIncome,
  FixedOccurrence,
  GetSubscriptionsSummaryParams,
  ListFixedOccurrencesParams,
  ListSubscriptionChargesParams,
  ListSubscriptionsParams,
  Subscription,
  SubscriptionCharge,
  SubscriptionsSummary,
} from "@/api/generated/client";
import {
  listFixedExpensesData,
  listFixedIncomesData,
  listFixedOccurrencesData,
} from "@/features/recurrences/api/fixed";
import {
  getSubscriptionsSummaryData,
  listSubscriptionChargesData,
  listSubscriptionsData,
} from "@/features/recurrences/api/subscriptions";
import {
  recurrenceRailDateRange,
  toRecurrenceRailItems,
} from "@/features/recurrences/lib/recurrence-presentation";
import { ApiError } from "@/lib/http";

export function subscriptionsQueryKey(filters: ListSubscriptionsParams = {}) {
  return ["subscriptions", filters] as const;
}

export const subscriptionsSummaryQueryKey = ["subscriptions-summary"] as const;
export const fixedExpensesQueryKey = ["fixed-expenses"] as const;
export const fixedIncomesQueryKey = ["fixed-incomes"] as const;

export function subscriptionChargesQueryKey(filters: ListSubscriptionChargesParams = {}) {
  return ["subscription-charges", filters] as const;
}

export function fixedOccurrencesQueryKey(filters: ListFixedOccurrencesParams = {}) {
  return ["fixed-occurrences", filters] as const;
}

export function useSubscriptions(filters: ListSubscriptionsParams = {}) {
  return useQuery<Subscription[], ApiError>({
    queryKey: subscriptionsQueryKey(filters),
    queryFn: () => listSubscriptionsData(filters),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useSubscriptionsSummary(params: GetSubscriptionsSummaryParams = {}) {
  return useQuery<SubscriptionsSummary, ApiError>({
    queryKey: subscriptionsSummaryQueryKey,
    queryFn: () => getSubscriptionsSummaryData(params),
    retry: false,
  });
}

export function useFixedExpenses() {
  return useQuery<FixedExpense[], ApiError>({
    queryKey: fixedExpensesQueryKey,
    queryFn: listFixedExpensesData,
    retry: false,
  });
}

export function useFixedIncomes() {
  return useQuery<FixedIncome[], ApiError>({
    queryKey: fixedIncomesQueryKey,
    queryFn: listFixedIncomesData,
    retry: false,
  });
}

export function useSubscriptionCharges(filters: ListSubscriptionChargesParams = {}) {
  return useQuery<SubscriptionCharge[], ApiError>({
    queryKey: subscriptionChargesQueryKey(filters),
    queryFn: () => listSubscriptionChargesData(filters),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useFixedOccurrences(filters: ListFixedOccurrencesParams = {}) {
  return useQuery<FixedOccurrence[], ApiError>({
    queryKey: fixedOccurrencesQueryKey(filters),
    queryFn: () => listFixedOccurrencesData(filters),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useRecurrencesRail() {
  const range = useMemo(() => recurrenceRailDateRange(), []);
  const subscriptions = useSubscriptions();
  const fixedExpenses = useFixedExpenses();
  const fixedIncomes = useFixedIncomes();
  const subscriptionCharges = useSubscriptionCharges({
    status: "pending",
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const fixedOccurrences = useFixedOccurrences({
    status: "pending",
    startDate: range.startDate,
    endDate: range.endDate,
  });

  const items = useMemo(
    () =>
      toRecurrenceRailItems({
        subscriptionCharges: subscriptionCharges.data ?? [],
        fixedOccurrences: fixedOccurrences.data ?? [],
        activeSubscriptionIds: new Set((subscriptions.data ?? []).filter((item) => item.isActive).map((item) => item.id)),
        activeFixedExpenseIds: new Set((fixedExpenses.data ?? []).filter((item) => item.isActive).map((item) => item.id)),
        activeFixedIncomeIds: new Set((fixedIncomes.data ?? []).filter((item) => item.isActive).map((item) => item.id)),
      }),
    [fixedExpenses.data, fixedIncomes.data, fixedOccurrences.data, subscriptionCharges.data, subscriptions.data],
  );

  return {
    items,
    isPending:
      subscriptions.isPending ||
      fixedExpenses.isPending ||
      fixedIncomes.isPending ||
      subscriptionCharges.isPending ||
      fixedOccurrences.isPending,
    isError:
      subscriptions.isError ||
      fixedExpenses.isError ||
      fixedIncomes.isError ||
      subscriptionCharges.isError ||
      fixedOccurrences.isError,
    refetch: async () => {
      await Promise.all([
        subscriptions.refetch({ cancelRefetch: false }),
        fixedExpenses.refetch({ cancelRefetch: false }),
        fixedIncomes.refetch({ cancelRefetch: false }),
        subscriptionCharges.refetch({ cancelRefetch: false }),
        fixedOccurrences.refetch({ cancelRefetch: false }),
      ]);
    },
  };
}
