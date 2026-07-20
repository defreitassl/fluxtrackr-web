"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type {
  FinancialTimeline,
  FinancialTimelineSourceType,
  FinancialTimelineType,
  GetFinancialTimelineParams,
} from "@/api/generated/client";
import { getFinancialTimelineData } from "@/features/timeline/api/get-financial-timeline";
import { ApiError } from "@/lib/http";

export type FinancialTimelineFilters = Pick<
  GetFinancialTimelineParams,
  "type" | "sourceType" | "includeCanceled"
>;

export type FinancialTimelineQueryParams = GetFinancialTimelineParams;

export function financialTimelineQueryKey(params: FinancialTimelineQueryParams) {
  return ["financial-timeline", params] as const;
}

export function useFinancialTimeline(params: FinancialTimelineQueryParams) {
  return useQuery<FinancialTimeline, ApiError>({
    queryKey: financialTimelineQueryKey(params),
    queryFn: () => getFinancialTimelineData(params),
    placeholderData: keepPreviousData,
  });
}

export const timelineTypeOptions: Array<{ value: FinancialTimelineType; label: string }> = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" },
  { value: "transfer", label: "Transferência" },
  { value: "adjustment", label: "Ajuste" },
];

export const timelineSourceOptions: Array<{ value: FinancialTimelineSourceType; label: string }> = [
  { value: "transaction", label: "Transação" },
  { value: "financial_event", label: "Evento financeiro" },
  { value: "credit_card_invoice", label: "Fatura" },
  { value: "fixed_expense", label: "Gasto fixo" },
  { value: "fixed_income", label: "Ganho fixo" },
  { value: "subscription", label: "Assinatura" },
  { value: "account_transfer", label: "Transferência" },
  { value: "account_balance_adjustment", label: "Ajuste de saldo" },
];
