import type { FinancialGoal, FinancialGoalStatus } from "@/api/generated/client";
import { formatDate } from "@/lib/format";

export type GoalStatusTone = "blue" | "green" | "neutral";

export const goalStatusLabels: Record<FinancialGoalStatus, string> = {
  active: "Ativa",
  completed: "Concluída",
  canceled: "Cancelada",
};

export const goalStatusTones: Record<FinancialGoalStatus, GoalStatusTone> = {
  active: "blue",
  completed: "green",
  canceled: "neutral",
};

/** Percentual para a barra, limitado a 0..100 (a API pode ultrapassar 100). */
export function goalVisualProgress(goal: FinancialGoal): number {
  const progress = Number(goal.progressPercentage);
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, progress));
}

/** Percentual textual sem clampe (ex.: "112%"). */
export function formatGoalProgress(value: string | number): string {
  const progress = Number(value);
  return `${Number.isFinite(progress) ? Math.round(progress) : 0}%`;
}

/** Formata só a parte de data (evita recuar um dia no fuso local). */
export function formatGoalDate(targetDate: string): string {
  return formatDate(targetDate.slice(0, 10));
}

/** Rótulo de prazo: "Faltam X dias", atraso ou "Sem prazo". */
export function goalDeadlineLabel(goal: FinancialGoal): string {
  if (!goal.targetDate) return "Sem prazo";
  const dateLabel = formatGoalDate(goal.targetDate);
  if (goal.status === "completed" || goal.status === "canceled") return `Prazo: ${dateLabel}`;
  if (goal.isOverdue) return `Atrasada — o prazo era ${dateLabel}`;
  if (goal.daysRemaining === 0) return `Termina hoje (${dateLabel})`;
  if (goal.daysRemaining !== null) {
    return `Faltam ${goal.daysRemaining} ${goal.daysRemaining === 1 ? "dia" : "dias"} (${dateLabel})`;
  }
  return `Prazo: ${dateLabel}`;
}
