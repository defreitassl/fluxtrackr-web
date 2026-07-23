import { ApiError } from "@/lib/http";

export type RecurrenceAction = "save" | "archive" | "realize" | "cancel";

export function getRecurrenceErrorMessage(error: unknown, action: RecurrenceAction = "save") {
  if (error instanceof ApiError) {
    if (error.status === 400) return error.message;
    if (error.status === 404) return "Esta recorrência não foi encontrada. Atualize a tela e tente novamente.";
    if (error.status === 409) {
      if (action === "realize") return "Esta pendência já foi realizada, cancelada ou não está mais disponível.";
      if (action === "cancel") return "Só é possível cancelar pendências ainda pendentes.";
      if (action === "archive") return "A recorrência mudou durante o arquivamento. Atualize a tela e tente novamente.";
      return "A recorrência mudou durante a operação. Atualize a tela e tente novamente.";
    }
    if (error.status === 503) return "Serviço indisponível. Tente novamente em instantes.";
  }

  return {
    save: "Não foi possível salvar a recorrência.",
    archive: "Não foi possível arquivar a recorrência.",
    realize: "Não foi possível realizar a pendência.",
    cancel: "Não foi possível cancelar a pendência.",
  }[action];
}
