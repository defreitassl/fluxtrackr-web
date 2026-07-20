import { describe, expect, it } from "vitest";

import { getBalanceAdjustmentErrorMessage } from "@/features/wallet/adjustments/lib/balance-adjustment-error-message";
import { ApiError } from "@/lib/http";

describe("getBalanceAdjustmentErrorMessage", () => {
  it.each([
    [400, "Não foi possível ajustar esta conta. Verifique o saldo informado."],
    [409, "O saldo mudou durante o ajuste. Atualize os dados e tente novamente."],
    [503, "Serviço indisponível. Tente novamente."],
    [500, "Não foi possível ajustar o saldo."],
  ])("maps HTTP %i without exposing technical details", (status, expected) => {
    expect(getBalanceAdjustmentErrorMessage(new ApiError(status, { message: "P2034" }))).toBe(expected);
  });
});
