import { ApiError } from "@/lib/http";

export function getCategoryBudgetErrorMessage(error: unknown, action: "save" | "archive" = "save") {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "Verifique os dados do orçamento e tente novamente.";
    }
    if (error.status === 404) {
      return "Este orçamento não foi encontrado. Atualize a página e tente novamente.";
    }
    if (error.status === 409) {
      return "Já existe um orçamento ativo para esta categoria neste período. Atualize os dados e tente novamente.";
    }
    if (error.status === 503) {
      return "Serviço indisponível. Tente novamente.";
    }
  }

  return action === "archive"
    ? "Não foi possível arquivar o orçamento."
    : "Não foi possível salvar o orçamento.";
}
