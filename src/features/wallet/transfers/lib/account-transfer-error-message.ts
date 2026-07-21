import { ApiError } from "@/lib/http";

export function getAccountTransferErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Não foi possível realizar a transferência. Verifique as contas e o valor informado.";
      case 409:
        return "Os saldos mudaram durante a transferência. Atualize os dados e tente novamente.";
      case 503:
        return "Serviço indisponível. Tente novamente.";
      default:
        return "Não foi possível realizar a transferência.";
    }
  }

  return "Não foi possível realizar a transferência.";
}
