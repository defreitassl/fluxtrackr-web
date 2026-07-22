"use client";

import { ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import type { Category, CategoryBudgetOverviewBudgetsItem } from "@/api/generated/client";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import { getCategoryBudgetErrorMessage } from "@/features/planning/lib/category-budget-error-message";
import type { PlanningPeriod } from "@/features/planning/lib/planning-period";
import {
  useCreateCategoryBudget,
  useUpdateCategoryBudget,
} from "@/features/planning/mutations/use-category-budget-mutations";
import {
  categoryBudgetFormSchema,
  toCreateCategoryBudgetPayload,
  toUpdateCategoryBudgetPayload,
} from "@/features/planning/schemas/category-budget-form-schema";
import { cn } from "@/lib/cn";

const WARNING_OPTIONS = [70, 80, 90];

type BudgetDrawerProps = {
  open: boolean;
  period: PlanningPeriod;
  /** orçamento em edição; null = criação */
  editing: CategoryBudgetOverviewBudgetsItem | null;
  /** pré-seleção de categoria ao criar (via "Definir") */
  initialCategoryId: string | null;
  categoriesWithoutBudget: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onArchive: (budget: CategoryBudgetOverviewBudgetsItem) => void;
};

export function BudgetDrawer({
  open,
  period,
  editing,
  initialCategoryId,
  categoriesWithoutBudget,
  onClose,
  onSaved,
  onArchive,
}: BudgetDrawerProps) {
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [warningPercentage, setWarningPercentage] = useState(80);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateCategoryBudget();
  const updateMutation = useUpdateCategoryBudget();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Reinicia o formulário quando o drawer abre (ajuste de estado no render).
  const session = open ? (editing?.id ?? `new-${initialCategoryId ?? ""}`) : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setError(null);
      if (editing) {
        setCategoryId(editing.category.id);
        setLimitAmount(editing.limitAmount);
        setWarningPercentage(editing.warningPercentage);
      } else {
        setCategoryId(initialCategoryId ?? categoriesWithoutBudget[0]?.id ?? "");
        setLimitAmount("");
        setWarningPercentage(80);
      }
    }
  }

  const selectedCategory =
    editing?.category ?? categoriesWithoutBudget.find((category) => category.id === categoryId);
  const preview = selectedCategory ? categoryPresentation(selectedCategory) : null;

  function save() {
    setError(null);
    const parsed = categoryBudgetFormSchema.safeParse({
      categoryId: editing ? editing.category.id : categoryId,
      limitAmount,
      warningPercentage,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados do orçamento.");
      return;
    }

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, payload: toUpdateCategoryBudgetPayload(parsed.data) },
        {
          onSuccess: () => onSaved("Orçamento atualizado."),
          onError: (mutationError) => setError(getCategoryBudgetErrorMessage(mutationError)),
        },
      );
      return;
    }

    createMutation.mutate(toCreateCategoryBudgetPayload(parsed.data, period), {
      onSuccess: () => onSaved("Orçamento criado."),
      onError: (mutationError) => setError(getCategoryBudgetErrorMessage(mutationError)),
    });
  }

  return (
    <>
      <div aria-hidden="true" className={cn("txx-backdrop", open && "txx-backdrop-open")} onClick={onClose} />
      <aside
        aria-hidden={!open}
        aria-label={editing ? "Editar orçamento" : "Novo orçamento"}
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>{editing ? "Editar orçamento" : "Novo orçamento"}</strong>
            <p>Defina um limite mensal para uma categoria</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="txx-drawer-body">
          <label className="txx-field">
            <span>Categoria</span>
            {editing ? (
              <div className="txx-input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {preview ? (
                  <span
                    className="wlx-avatar"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      background: `color-mix(in srgb, ${preview.color} 15%, transparent)`,
                      color: preview.color,
                    }}
                  >
                    <preview.Icon aria-hidden="true" size={13} />
                  </span>
                ) : null}
                {editing.category.name}
              </div>
            ) : (
              <select
                aria-label="Categoria"
                className="txx-select"
                onChange={(event) => setCategoryId(event.target.value)}
                value={categoryId}
              >
                {categoriesWithoutBudget.length === 0 ? (
                  <option value="">Nenhuma categoria disponível</option>
                ) : null}
                {categoriesWithoutBudget.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="txx-field">
            <span>Limite mensal</span>
            <div className="txx-amount-input">
              <span aria-hidden="true">R$</span>
              <input
                aria-label="Limite mensal"
                inputMode="decimal"
                onChange={(event) => setLimitAmount(event.target.value)}
                placeholder="0,00"
                value={limitAmount}
              />
            </div>
          </label>

          <div className="txx-field">
            <span className="txx-field-label">Avisar quando atingir</span>
            <div className="plx-warn-chips">
              {WARNING_OPTIONS.map((option) => (
                <button
                  aria-pressed={warningPercentage === option}
                  key={option}
                  onClick={() => setWarningPercentage(option)}
                  type="button"
                >
                  {option}%
                </button>
              ))}
            </div>
          </div>

          <div className="plx-shield-note">
            <ShieldCheck aria-hidden="true" color="var(--blue)" size={15} style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span>
              O limite serve para te avisar. Você <strong>nunca</strong> será impedido de registrar um
              gasto por causa dele.
            </span>
          </div>

          {editing ? (
            <button
              className="txx-chip txx-chip-ghost"
              onClick={() => onArchive(editing)}
              style={{ marginTop: 16, color: "var(--danger)" }}
              type="button"
            >
              Arquivar orçamento
            </button>
          ) : null}

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
            {isSaving ? "Salvando…" : "Salvar orçamento"}
          </button>
        </div>
      </aside>
    </>
  );
}
