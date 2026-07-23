"use client";

import { CalendarClock, Target } from "lucide-react";

import type { FinancialGoalsOverview } from "@/api/generated/client";
import { formatGoalDate, formatGoalProgress } from "@/features/goals/lib/goal-presentation";
import { formatCurrency } from "@/lib/format";

type GoalsHeroProps = {
  overview: FinancialGoalsOverview;
};

export function GoalsHero({ overview }: GoalsHeroProps) {
  const { summary, nextDeadline } = overview;
  const totalTarget = Number(summary.totalTargetAmount);
  const totalCurrent = Number(summary.totalCurrentAmount);
  const usage = totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0;

  return (
    <div className="glx-hero">
      <div className="glx-hero-inner">
        <div style={{ minWidth: 0 }}>
          <div className="tlx-card-title">
            <Target aria-hidden="true" color="var(--blue)" size={15} />
            Guardado para metas
          </div>
          <div className="glx-hero-value">
            <strong>{formatCurrency(summary.totalCurrentAmount)}</strong>
            <span>de {formatCurrency(summary.totalTargetAmount)} planejados</span>
          </div>
          <div className="glx-progress" aria-hidden="true">
            <i className="glx-progress-fill" style={{ width: `${usage}%` }} />
          </div>
          <div className="glx-hero-meta">
            <span>{formatGoalProgress(summary.averageProgressPercentage)} de progresso médio</span>
            <span>{formatCurrency(summary.totalRemainingAmount)} restantes</span>
          </div>
        </div>
        <div className="glx-hero-chips">
          <span className="glx-status-chip tlx-tone-blue">
            <i aria-hidden="true" />
            {summary.activeGoals} {summary.activeGoals === 1 ? "ativa" : "ativas"}
          </span>
          <span className="glx-status-chip tlx-tone-green">
            <i aria-hidden="true" />
            {summary.completedGoals} {summary.completedGoals === 1 ? "concluída" : "concluídas"}
          </span>
          <span className="glx-status-chip tlx-tone-red">
            <i aria-hidden="true" />
            {summary.overdueGoals} {summary.overdueGoals === 1 ? "atrasada" : "atrasadas"}
          </span>
        </div>
      </div>
      <div className="glx-hero-note">
        <CalendarClock aria-hidden="true" color="var(--blue)" size={15} />
        <span>
          {nextDeadline ? (
            <>
              Próximo prazo: <strong>{nextDeadline.name}</strong> em{" "}
              {formatGoalDate(nextDeadline.targetDate)} — faltam{" "}
              {formatCurrency(nextDeadline.remainingAmount)}.
            </>
          ) : (
            "Nenhum prazo à vista — defina datas nas metas para acompanhar o ritmo."
          )}
        </span>
      </div>
    </div>
  );
}
