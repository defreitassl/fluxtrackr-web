import { ApiError } from "@/lib/http";

type CreditCardAction = "archive" | "create" | "pay" | "purchase" | "update";

export function getCreditCardErrorMessage(error: unknown, action: CreditCardAction) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      if (action === "create" || action === "update" || action === "archive") {
        return "Verifique os dados do cartão e tente novamente.";
      }
      return action === "purchase"
        ? "Não foi possível registrar a compra no cartão."
        : "Não foi possível pagar a fatura.";
    }
    if (error.status === 404) {
      if (action === "create" || action === "update" || action === "archive") {
        return "O cartão não foi encontrado.";
      }
      return action === "purchase"
        ? "Não foi possível registrar a compra no cartão."
        : "Não foi possível pagar a fatura.";
    }
    if (error.status === 409) {
      return "Os dados foram alterados durante a operação. Atualize a Carteira e tente novamente.";
    }
    if (error.status === 503) {
      return "Serviço indisponível. Tente novamente em instantes.";
    }
  }

  const messages: Record<CreditCardAction, string> = {
    archive: "Não foi possível arquivar o cartão.",
    create: "Não foi possível criar o cartão.",
    pay: "Não foi possível pagar a fatura.",
    purchase: "Não foi possível registrar a compra no cartão.",
    update: "Não foi possível atualizar o cartão.",
  };

  return messages[action];
}
