"use client";

import { PiggyBank, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { FinancialGoal } from "@/api/generated/client";
import { getGoalErrorMessage } from "@/features/goals/lib/goal-error-message";
import {
  useCreateFinancialGoal,
  useUpdateFinancialGoal,
} from "@/features/goals/mutations/use-goal-mutations";
import {
  defaultGoalFormValues,
  goalFormSchema,
  toCreateGoalPayload,
  toGoalFormValues,
  toUpdateGoalPayload,
  type GoalFormValues,
} from "@/features/goals/schemas/goal-form-schema";
import { cn } from "@/lib/cn";

type GoalDrawerProps = {
  open: boolean;
  editing: FinancialGoal | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function GoalDrawer({ open, editing, onClose, onSaved }: GoalDrawerProps) {
  const [values, setValues] = useState<GoalFormValues>(() => defaultGoalFormValues());
  const [error, setError] = useState<string | null>(null);

  // Reinicia o formulário sempre que o drawer abre (ajuste de estado no render).
  const session = open ? (editing?.id ?? "new") : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setError(null);
      setValues(editing ? toGoalFormValues(editing) : defaultGoalFormValues());
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

  const createMutation = useCreateFinancialGoal();
  const updateMutation = useUpdateFinancialGoal();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function save() {
    setError(null);
    const parsed = goalFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados da meta.");
      return;
    }

    if (editing) {
      const payload = toUpdateGoalPayload(parsed.data, editing);
      if (Object.keys(payload).length === 0) {
        onSaved("Meta atualizada.");
        return;
      }
      updateMutation.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => onSaved("Meta atualizada."),
          onError: (mutationError) => setError(getGoalErrorMessage(mutationError, "save")),
        },
      );
      return;
    }

    createMutation.mutate(toCreateGoalPayload(parsed.data), {
      onSuccess: () => onSaved("Meta criada."),
      onError: (mutationError) => setError(getGoalErrorMessage(mutationError, "save")),
    });
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
        aria-label={editing ? "Editar meta" : "Nova meta"}
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>{editing ? "Editar meta" : "Nova meta"}</strong>
            <p>Objetivo de poupança com progresso acompanhado</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="txx-drawer-body">
          <label className="txx-field">
            <span>Nome da meta</span>
            <input
              className="txx-input"
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Reserva de emergência"
              value={values.name}
            />
          </label>

          <label className="txx-field">
            <span>Valor alvo</span>
            <div className="txx-amount-input">
              <span aria-hidden="true">R$</span>
              <input
                aria-label="Valor alvo"
                inputMode="decimal"
                onChange={(event) =>
                  setValues((current) => ({ ...current, targetAmount: event.target.value }))
                }
                placeholder="0,00"
                value={values.targetAmount}
              />
            </div>
          </label>

          <div className="txx-field-row txx-field">
            <label>
              <span className="txx-field-label">Prazo (opcional)</span>
              <input
                aria-label="Prazo"
                className="txx-input"
                onChange={(event) =>
                  setValues((current) => ({ ...current, targetDate: event.target.value }))
                }
                type="date"
                value={values.targetDate}
              />
            </label>
            {!editing ? (
              <label>
                <span className="txx-field-label">Valor inicial (opcional)</span>
                <div className="txx-amount-input">
                  <span aria-hidden="true">R$</span>
                  <input
                    aria-label="Valor inicial"
                    inputMode="decimal"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, initialAmount: event.target.value }))
                    }
                    placeholder="0,00"
                    value={values.initialAmount}
                  />
                </div>
              </label>
            ) : (
              <div aria-hidden="true" />
            )}
          </div>

          <label className="txx-field">
            <span>Descrição</span>
            <textarea
              className="txx-input"
              onChange={(event) =>
                setValues((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Opcional"
              rows={2}
              value={values.description}
            />
          </label>

          <div className="glx-shield-note">
            <PiggyBank aria-hidden="true" color="var(--blue)" size={15} />
            <span>
              Aportes não movimentam suas contas — este é um controle separado. Concluir a meta é
              automático: basta aportar até o alvo.
            </span>
          </div>

          {error ? (
            <p className="txx-form-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="txx-drawer-foot">
          <button className="txx-drawer-cancel" disabled={isSaving} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="txx-drawer-save" disabled={isSaving} onClick={save} type="button">
            {isSaving ? "Salvando…" : "Salvar meta"}
          </button>
        </div>
      </aside>
    </>
  );
}
