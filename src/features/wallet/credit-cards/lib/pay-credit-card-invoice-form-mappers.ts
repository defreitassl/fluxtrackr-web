import type {
  CreditCardInvoiceWithInstallments,
  PayCreditCardInvoiceRequest,
} from "@/api/generated/client";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import type { PayCreditCardInvoiceFormValues } from "@/features/wallet/credit-cards/schemas/pay-credit-card-invoice-form-schema";

export function defaultPayCreditCardInvoiceFormValues(
  invoice: CreditCardInvoiceWithInstallments,
  accounts: WalletAccount[],
): PayCreditCardInvoiceFormValues {
  const preferredAccount = accounts.find(({ account }) => account.id === invoice.accountId)?.account.id;

  return { accountId: preferredAccount ?? accounts[0]?.account.id ?? "", paidAt: "" };
}

export function toPayCreditCardInvoicePayload(
  values: PayCreditCardInvoiceFormValues,
): PayCreditCardInvoiceRequest {
  return {
    accountId: values.accountId,
    ...(values.paidAt ? { paidAt: new Date(values.paidAt).toISOString() } : {}),
  };
}
