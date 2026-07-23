import { ApiError } from "@/lib/http";

export type GoalErrorAction = "save" | "cancel" | "contribute";

/** Traduções das mensagens de validação conhecidas da API (400). */
const knownBadRequestMessages: Array<{ match: string; message: string }> = [
  {
    match: "Financial goal status completed is derived from progress",
    message: "O status Concluída é derivado do progresso — aporte até atingir o alvo.",
  },
  {
    match: "targetDate cannot be in the past",
    message: "O prazo da meta não pode ficar no passado.",
  },
  {
    match: "Canceled financial goals do not accept contributions",
    message: "Metas canceladas não aceitam aportes. Reative a meta primeiro.",
  },
  {
    match: "occurredAt cannot be in the future",
    message: "A data do aporte não pode estar no futuro.",
  },
  {
    match: "Withdrawal would make historical goal balance negative",
    message: "Este resgate deixaria o histórico da meta negativo. Reduza o valor do resgate.",
  },
  {
    match: "initialAmount must be zero or greater",
    message: "O valor inicial não pode ser negativo.",
  },
  {
    match: "Financial goal name is required",
    message: "Informe o nome da meta.",
  },
  {
    match: "must be greater than zero",
    message: "Informe um valor maior que zero.",
  },
];

const fallbackMessages: Record<GoalErrorAction, string> = {
  save: "Não foi possível salvar a meta.",
  cancel: "Não foi possível cancelar a meta.",
  contribute: "Não foi possível registrar a movimentação da meta.",
};

export function getGoalErrorMessage(error: unknown, action: GoalErrorAction = "save") {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      const known = knownBadRequestMessages.find((entry) => error.message.includes(entry.match));
      return known?.message ?? error.message;
    }
    if (error.status === 404) {
      return "Esta meta não foi encontrada. Atualize a lista e tente novamente.";
    }
    if (error.status === 409) {
      return "A meta foi alterada durante a operação. Atualize os dados e tente novamente.";
    }
    if (error.status === 503) {
      return "Serviço indisponível. Tente novamente.";
    }
  }

  return fallbackMessages[action];
}
