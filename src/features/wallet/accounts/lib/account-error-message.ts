import { ApiError } from "@/lib/http";

export type AccountErrorAction = "save" | "archive";

/**
 * Traduz falhas de escrita de conta para mensagens compreensíveis, sem expor
 * stack trace, URL interna, payload técnico ou nome de tabela/constraint.
 */
export function getAccountErrorMessage(error: unknown, action: AccountErrorAction = "save"): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Verifique os dados informados e tente novamente.";
      case 409:
        return "Já existe uma conta com este nome.";
      case 503:
        return "Serviço indisponível. Tente novamente.";
      default:
        return action === "archive" ? "Não foi possível arquivar a conta." : "Não foi possível salvar a conta.";
    }
  }

  return action === "archive" ? "Não foi possível arquivar a conta." : "Não foi possível salvar a conta.";
}
