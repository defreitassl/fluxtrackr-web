import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({ listCreditCardPurchases: vi.fn() }));

import { listCreditCardPurchases } from "@/api/generated/client";
import { listCreditCardPurchasesData } from "@/features/wallet/credit-cards/api/list-credit-card-purchases";
import { ApiError } from "@/lib/http";

afterEach(() => vi.resetAllMocks());

describe("listCreditCardPurchasesData", () => {
  it("returns purchases with their installments for the selected card", async () => {
    const purchases = [{ id: "purchase-1", installments: [{ id: "installment-1" }] }];
    vi.mocked(listCreditCardPurchases).mockResolvedValue({ status: 200, data: purchases } as never);

    await expect(listCreditCardPurchasesData({ creditCardId: "card-1" })).resolves.toBe(purchases);
    expect(listCreditCardPurchases).toHaveBeenCalledWith({ creditCardId: "card-1" });
  });

  it("turns an unexpected response into ApiError and preserves client failures", async () => {
    vi.mocked(listCreditCardPurchases).mockResolvedValue({ status: 401, data: { message: "unauthorized" } } as never);
    await expect(listCreditCardPurchasesData({ creditCardId: "card-1" })).rejects.toBeInstanceOf(ApiError);

    const error = new ApiError(503, { message: "offline" });
    vi.mocked(listCreditCardPurchases).mockRejectedValue(error);
    await expect(listCreditCardPurchasesData({ creditCardId: "card-1" })).rejects.toBe(error);
  });
});
