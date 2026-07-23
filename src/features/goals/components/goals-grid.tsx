"use client";

import type { FinancialGoal } from "@/api/generated/client";
import {
  formatGoalProgress,
  goalDeadlineLabel,
  goalStatusLabels,
  goalStatusTones,
  goalVisualProgress,
} from "@/features/goals/lib/goal-presentation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

type GoalsGridProps = {
  goals: FinancialGoal[];
  onContribute: (goal: FinancialGoal) => void;
  onEdit: (goal: FinancialGoal) => void;
  onCancel: (goal: FinancialGoal) => void;
  onReactivate: (goal: FinancialGoal) => void;
};

export function GoalsGrid({ goals, onContribute, onEdit, onCancel, onReactivate }: GoalsGridProps) {
  return (
    <div className="glx-grid">
      {goals.map((goal) => {
        const isCanceled = goal.status === "canceled";
        const isCompleted = goal.status === "completed";
        const showOverdue = goal.isOverdue && goal.status === "active";
        const progress = goalVisualProgress(goal);

        return (
          <article
            aria-label={goal.name}
            className={cn("glx-card", isCanceled && "glx-card-canceled")}
            key={goal.id}
          >
            <div className="glx-card-head">
              <strong>{goal.name}</strong>
              <span className="glx-status-pill" data-tone={goalStatusTones[goal.status]}>
                {goalStatusLabels[goal.status]}
              </span>
              {showOverdue ? (
                <span className="glx-status-pill" data-tone="red">
                  Atrasada
                </span>
              ) : null}
            </div>

            {goal.description ? <p className="glx-card-description">{goal.description}</p> : null}

            <div className="glx-card-amounts">
              <strong>{formatCurrency(goal.currentAmount)}</strong>
              <span>de {formatCurrency(goal.targetAmount)}</span>
            </div>

            <div
              aria-label={`Progresso de ${goal.name}`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(progress)}
              className="glx-progress"
              role="progressbar"
            >
              <i
                className={cn("glx-progress-fill", isCompleted && "glx-progress-fill-complete")}
                data-testid={`goal-progress-${goal.id}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="glx-card-foot">
              <span className={showOverdue ? "glx-deadline-overdue" : undefined}>
                {goalDeadlineLabel(goal)}
              </span>
              <span className="glx-card-progress">{formatGoalProgress(goal.progressPercentage)}</span>
            </div>

            {goal.status === "active" && goal.requiredMonthlyContribution ? (
              <p className="glx-card-monthly">
                Aporte mensal necessário: <strong>{formatCurrency(goal.requiredMonthlyContribution)}</strong>
              </p>
            ) : null}

            <div className="glx-card-actions">
              {isCanceled ? (
                <button className="txx-chip" onClick={() => onReactivate(goal)} type="button">
                  Reativar
                </button>
              ) : (
                <>
                  <button
                    className="txx-chip glx-action-primary"
                    onClick={() => onContribute(goal)}
                    type="button"
                  >
                    Aporte / Resgate
                  </button>
                  <button className="txx-chip" onClick={() => onEdit(goal)} type="button">
                    Editar
                  </button>
                  <button className="txx-chip glx-action-danger" onClick={() => onCancel(goal)} type="button">
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
