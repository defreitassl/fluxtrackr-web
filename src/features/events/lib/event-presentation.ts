import type { FinancialEventStatus, RecurrenceType } from "@/api/generated/client";

export type EventStatusTone = "blue" | "green" | "amber" | "red" | "neutral";

export const eventStatusLabels: Record<FinancialEventStatus, string> = {
  planned: "Planejado",
  confirmed: "Confirmado",
  postponed: "Adiado",
  canceled: "Cancelado",
  realized: "Realizado",
};

export const eventStatusTones: Record<FinancialEventStatus, EventStatusTone> = {
  planned: "blue",
  confirmed: "green",
  postponed: "amber",
  canceled: "red",
  realized: "neutral",
};

const recurrenceLabels: Partial<Record<RecurrenceType, string>> = {
  once: "Único",
  monthly: "Mensal",
  semiannual: "Semestral",
  yearly: "Anual",
};

export function eventRecurrenceLabel(recurrence: RecurrenceType) {
  return recurrenceLabels[recurrence] ?? recurrence;
}

export function isRecurringEvent(recurrence: RecurrenceType) {
  return recurrence !== "once";
}

/**
 * Máquina de ações da API (financial-events.service): a UI nunca oferece uma
 * ação que o backend rejeitaria para o status atual.
 */
export function canEditEvent(status: FinancialEventStatus) {
  return status === "planned" || status === "postponed";
}

export function canConfirmEvent(status: FinancialEventStatus) {
  return status === "planned" || status === "postponed";
}

export function canPostponeEvent(status: FinancialEventStatus) {
  return status === "planned" || status === "postponed" || status === "confirmed";
}

/** Somente eventos confirmados podem ser realizados (planned mostra hint). */
export function canRealizeEvent(status: FinancialEventStatus) {
  return status === "confirmed";
}

export function canCancelEvent(status: FinancialEventStatus) {
  return status !== "realized" && status !== "canceled";
}
