import { ApiError } from "@/lib/http";

/**
 * Traduz falhas de escrita de conta para mensagens compreensíveis, sem expor
 * stack trace, URL interna, payload técnico ou nome de tabela/constraint.
 */
export function getAccountErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Verifique os dados informados e tente novamente.";
      case 409:
        return "Já existe uma conta com este nome.";
      case 503:
        return "Serviço indisponível. Tente novamente.";
      default:
        return "Não foi possível salvar a conta.";
    }
  }

  return "Não foi possível salvar a conta.";
}
