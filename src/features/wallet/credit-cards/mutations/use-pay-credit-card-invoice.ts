"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PaidCreditCardInvoice, PayCreditCardInvoiceRequest } from "@/api/generated/client";
import { payCreditCardInvoiceData } from "@/features/wallet/credit-cards/api/pay-credit-card-invoice";
import { ApiError } from "@/lib/http";

type PayCreditCardInvoiceVariables = { id: string; payload: PayCreditCardInvoiceRequest };

export function usePayCreditCardInvoice() {
  const queryClient = useQueryClient();

  return useMutation<PaidCreditCardInvoice, ApiError, PayCreditCardInvoiceVariables>({
    mutationFn: ({ id, payload }) => payCreditCardInvoiceData(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-timeline"] }),
        queryClient.invalidateQueries({ queryKey: ["credit-card-invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["credit-card-purchases"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-summary"] }),
      ]);
    },
  });
}
