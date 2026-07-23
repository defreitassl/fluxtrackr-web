"use client";

import { PiggyBank, TrendingDown, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { FinancialGoal, GoalContributionType } from "@/api/generated/client";
import { getGoalErrorMessage } from "@/features/goals/lib/goal-error-message";
import { formatGoalProgress } from "@/features/goals/lib/goal-presentation";
import { useCreateGoalContribution } from "@/features/goals/mutations/use-goal-mutations";
import { useGoalContributions } from "@/features/goals/queries/use-financial-goals";
import {
  contributionFormSchema,
  defaultContributionFormValues,
  toCreateContributionPayload,
  type ContributionFormValues,
} from "@/features/goals/schemas/goal-form-schema";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDateTime } from "@/lib/format";

type GoalContributionDrawerProps = {
  goal: FinancialGoal | null;
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
};

const typeTabs: Array<{ value: GoalContributionType; label: string; className: string }> = [
  { value: "contribution", label: "Aporte", className: "txx-type-income" },
  { value: "withdrawal", label: "Resgate", className: "txx-type-expense" },
];

export function GoalContributionDrawer({ goal, open, onClose, onSaved }: GoalContributionDrawerProps) {
  const [values, setValues] = useState<ContributionFormValues>(() => defaultContributionFormValues());
  const [error, setError] = useState<string | null>(null);

  // Reinicia o formulário sempre que o drawer abre para uma meta.
  const session = open && goal ? goal.id : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setError(null);
      setValues(defaultContributionFormValues());
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const contributions = useGoalContributions(open && goal ? goal.id : null);
  const mutation = useCreateGoalContribution();

  function save() {
    if (!goal) return;
    setError(null);
    const parsed = contributionFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados da movimentação.");
      return;
    }

    mutation.mutate(
      { goalId: goal.id, payload: toCreateContributionPayload(parsed.data) },
      {
        onSuccess: () =>
          onSaved(parsed.data.type === "contribution" ? "Aporte registrado." : "Resgate registrado."),
        onError: (mutationError) => setError(getGoalErrorMessage(mutationError, "contribute")),
      },
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={cn("txx-backdrop", open && "txx-backdrop-open")}
        onClick={onClose}
      />
      <aside
        aria-hidden={!open}
        aria-label="Aporte ou resgate da meta"
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>{goal ? goal.name : "Meta"}</strong>
            <p>
              {goal
                ? `${formatCurrency(goal.currentAmount)} de ${formatCurrency(goal.targetAmount)} · ${formatGoalProgress(goal.progressPercentage)}`
                : "Registre aportes e resgates"}
            </p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="txx-drawer-body">
          <div className="txx-type-tabs" role="group" aria-label="Tipo de movimentação da meta">
            {typeTabs.map((tab) => (
              <button
                aria-pressed={values.type === tab.value}
                className={tab.className}
                key={tab.value}
                onClick={() => {
                  setError(null);
                  setValues((current) => ({ ...current, type: tab.value }));
                }}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="txx-field">
            <span>Valor</span>
            <div className="txx-amount-input">
              <span aria-hidden="true">R$</span>
              <input
                aria-label="Valor"
                inputMode="decimal"
                onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0,00"
                value={values.amount}
              />
            </div>
          </label>

          <label className="txx-field">
            <span>Data</span>
            <input
              aria-label="Data"
              className="txx-input"
              onChange={(event) =>
                setValues((current) => ({ ...current, occurredAt: event.target.value }))
              }
              type="datetime-local"
              value={values.occurredAt}
            />
          </label>

          <label className="txx-field">
            <span>Observação</span>
            <input
              className="txx-input"
              onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))}
              placeholder="Opcional"
              value={values.note}
            />
          </label>

          <div className="glx-shield-note">
            <PiggyBank aria-hidden="true" color="var(--blue)" size={15} />
            <span>Aportes não movimentam suas contas — este é um controle separado.</span>
          </div>

          {error ? (
            <p className="txx-form-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="glx-contributions">
            <p className="txx-field-label">Histórico</p>
            {contributions.isPending ? (
              <p className="glx-contributions-empty">Carregando histórico…</p>
            ) : contributions.isError ? (
              <p className="glx-contributions-empty">Não foi possível carregar o histórico.</p>
            ) : (contributions.data ?? []).length === 0 ? (
              <p className="glx-contributions-empty">Nenhum aporte registrado ainda.</p>
            ) : (
              <ul className="glx-contribution-list">
                {(contributions.data ?? []).map((contribution) => {
                  const isContribution = contribution.type === "contribution";
                  return (
                    <li className="glx-contribution-row" key={contribution.id}>
                      <span
                        className={cn(
                          "glx-contribution-icon",
                          isContribution ? "tlx-tone-green" : "tlx-tone-red",
                        )}
                      >
                        {isContribution ? (
                          <TrendingUp aria-hidden="true" size={13} />
                        ) : (
                          <TrendingDown aria-hidden="true" size={13} />
                        )}
                      </span>
                      <div>
                        <strong>{isContribution ? "Aporte" : "Resgate"}</strong>
                        <span>
                          {formatDateTime(contribution.occurredAt)}
                          {contribution.note ? ` · ${contribution.note}` : ""}
                        </span>
                      </div>
                      <strong className={isContribution ? "tlx-value-green" : "tlx-value-red"}>
                        {isContribution ? "+ " : "− "}
                        {formatCurrency(contribution.amount)}
                      </strong>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="txx-drawer-foot">
          <button className="txx-drawer-cancel" disabled={mutation.isPending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="txx-drawer-save" disabled={mutation.isPending} onClick={save} type="button">
            {mutation.isPending
              ? "Registrando…"
              : values.type === "contribution"
                ? "Registrar aporte"
                : "Registrar resgate"}
          </button>
        </div>
      </aside>
    </>
  );
}
