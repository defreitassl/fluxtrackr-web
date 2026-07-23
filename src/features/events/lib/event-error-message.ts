import { ApiError } from "@/lib/http";

export type EventErrorAction = "save" | "confirm" | "postpone" | "realize" | "cancel";

/** Traduções das mensagens de validação conhecidas da API (400). */
const knownBadRequestMessages: Array<{ match: string; message: string }> = [
  {
    match: "Account financial event requires paymentMethod to be realized",
    message:
      "Este evento em conta não tem método de pagamento definido. Adie o evento para editá-lo e definir o método antes de realizar.",
  },
  {
    match: "Only confirmed financial events can be realized",
    message: "Só é possível realizar eventos confirmados. Confirme o evento primeiro.",
  },
  {
    match: "Only planned or postponed financial events can be edited",
    message: "Só é possível editar eventos planejados ou adiados.",
  },
  {
    match: "Canceled or realized financial event cannot be changed",
    message: "Eventos cancelados ou realizados não podem ser alterados.",
  },
  {
    match: "Canceled financial event cannot be confirmed",
    message: "Eventos cancelados não podem ser confirmados.",
  },
  {
    match: "Income financial event requires accountId and does not accept creditCardId",
    message: "Receitas exigem uma conta e não aceitam cartão.",
  },
  {
    match: "Expense financial event requires either accountId or creditCardId",
    message: "Despesas exigem exatamente uma conta ou um cartão.",
  },
  {
    match: "Credit card financial event does not accept paymentMethod",
    message: "Eventos no cartão não aceitam método de pagamento.",
  },
  {
    match: "Account financial event does not accept credit paymentMethod",
    message: "Eventos em conta não aceitam o método crédito.",
  },
  {
    match: "Installments are only allowed for credit card expenses",
    message: "Parcelas só são permitidas em despesas no cartão.",
  },
  {
    match: "Expected amount must be greater than zero",
    message: "Informe um valor maior que zero.",
  },
];

const conflictMessages: Record<EventErrorAction, string> = {
  save: "O evento mudou de estado durante a operação. Atualize a lista e tente novamente.",
  confirm: "Este evento já foi confirmado. Atualize a lista para ver o estado atual.",
  postpone: "O evento mudou de estado durante a operação. Atualize a lista e tente novamente.",
  realize: "Este evento já foi realizado ou mudou de estado. Atualize a lista e tente novamente.",
  cancel: "O evento mudou de estado durante a operação. Atualize a lista e tente novamente.",
};

const fallbackMessages: Record<EventErrorAction, string> = {
  save: "Não foi possível salvar o evento.",
  confirm: "Não foi possível confirmar o evento.",
  postpone: "Não foi possível adiar o evento.",
  realize: "Não foi possível realizar o evento.",
  cancel: "Não foi possível cancelar o evento.",
};

export function getEventErrorMessage(error: unknown, action: EventErrorAction = "save") {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      const known = knownBadRequestMessages.find((entry) => error.message.includes(entry.match));
      return known?.message ?? error.message;
    }
    if (error.status === 404) {
      return "Este evento não foi encontrado. Atualize a lista e tente novamente.";
    }
    if (error.status === 409) {
      return conflictMessages[action];
    }
    if (error.status === 503) {
      return "Serviço indisponível. Tente novamente.";
    }
  }

  return fallbackMessages[action];
}
