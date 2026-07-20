import { ApiError } from "@/lib/http";

export function getBalanceAdjustmentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Não foi possível ajustar esta conta. Verifique o saldo informado.";
      case 409:
        return "O saldo mudou durante o ajuste. Atualize os dados e tente novamente.";
      case 503:
        return "Serviço indisponível. Tente novamente.";
      default:
        return "Não foi possível ajustar o saldo.";
    }
  }

  return "Não foi possível ajustar o saldo.";
}
