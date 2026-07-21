import {
  payCreditCardInvoice,
  type PaidCreditCardInvoice,
  type PayCreditCardInvoiceRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** A quitação integral é calculada e registrada pelo backend. */
export async function payCreditCardInvoiceData(
  id: string,
  payload: PayCreditCardInvoiceRequest,
): Promise<PaidCreditCardInvoice> {
  const response = await payCreditCardInvoice(id, payload);

  if (response.status !== 201) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
