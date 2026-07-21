"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm, type FieldError } from "react-hook-form";

import type { Category, CategoryBudgetOverviewBudgetsItem } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getCategoryBudgetErrorMessage } from "@/features/planning/lib/category-budget-error-message";
import { formatPlanningPeriod, type PlanningPeriod } from "@/features/planning/lib/planning-period";
import { useCreateCategoryBudget, useUpdateCategoryBudget } from "@/features/planning/mutations/use-category-budget-mutations";
import {
  categoryBudgetFormSchema,
  defaultCategoryBudgetFormValues,
  toCategoryBudgetFormValues,
  toCreateCategoryBudgetPayload,
  toUpdateCategoryBudgetPayload,
  type CategoryBudgetFormValues,
} from "@/features/planning/schemas/category-budget-form-schema";

type CategoryBudgetFormDialogProps = {
  budget?: CategoryBudgetOverviewBudgetsItem | null;
  categories: Category[];
  initialCategoryId?: string;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: (message: string) => void;
  open: boolean;
  period: PlanningPeriod;
};

export function CategoryBudgetFormDialog({
  budget,
  categories,
  initialCategoryId,
  mode,
  onClose,
  onSaved,
  open,
  period,
}: CategoryBudgetFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createBudget = useCreateCategoryBudget();
  const updateBudget = useUpdateCategoryBudget();

  if (mode === "edit" && !budget) {
    return null;
  }

  const isSubmitting = createBudget.isPending || updateBudget.isPending;
  const initialValues = budget
    ? toCategoryBudgetFormValues(budget)
    : defaultCategoryBudgetFormValues(initialCategoryId);
  const formKey = budget?.id ?? initialCategoryId ?? `${period.year}-${period.month}`;

  async function handleSubmit(values: CategoryBudgetFormValues) {
    setSubmitError(null);

    try {
      if (mode === "create") {
        await createBudget.mutateAsync(toCreateCategoryBudgetPayload(values, period));
        onSaved("Orçamento criado com sucesso.");
        return;
      }

      await updateBudget.mutateAsync({
        id: budget!.id,
        payload: toUpdateCategoryBudgetPayload(values),
      });
      onSaved("Orçamento atualizado com sucesso.");
    } catch (error) {
      setSubmitError(getCategoryBudgetErrorMessage(error));
    }
  }

  const idPrefix = mode === "create" ? "create-category-budget" : "edit-category-budget";

  return (
    <Dialog
      busy={isSubmitting}
      description={
        mode === "create"
          ? "Defina um limite mensal para uma categoria elegível no período selecionado."
          : "Atualize o limite ou o aviso. A categoria e o período permanecem os mesmos."
      }
      descriptionId={`${idPrefix}-description`}
      initialFocusSelector={mode === "create" ? `#${idPrefix}-category` : `#${idPrefix}-limit`}
      onClose={onClose}
      open={open}
      title={mode === "create" ? "Novo orçamento" : "Editar orçamento"}
      titleId={`${idPrefix}-title`}
    >
      <CategoryBudgetForm
        budget={budget}
        categories={categories}
        defaultValues={initialValues}
        idPrefix={idPrefix}
        isSubmitting={isSubmitting}
        key={`${mode}-${formKey}`}
        mode={mode}
        onCancel={onClose}
        onSubmit={handleSubmit}
        period={period}
        submitError={submitError}
      />
    </Dialog>
  );
}

type CategoryBudgetFormProps = {
  budget?: CategoryBudgetOverviewBudgetsItem | null;
  categories: Category[];
  defaultValues: CategoryBudgetFormValues;
  idPrefix: string;
  isSubmitting: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (values: CategoryBudgetFormValues) => void | Promise<void>;
  period: PlanningPeriod;
  submitError: string | null;
};

function CategoryBudgetForm({
  budget,
  categories,
  defaultValues,
  idPrefix,
  isSubmitting,
  mode,
  onCancel,
  onSubmit,
  period,
  submitError,
}: CategoryBudgetFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CategoryBudgetFormValues>({
    resolver: zodResolver(categoryBudgetFormSchema),
    defaultValues,
  });

  const fieldId = (field: "category" | "limit" | "warning") => `${idPrefix}-${field}`;
  const fieldErrorId = (field: "categoryId" | "limitAmount" | "warningPercentage") =>
    `${idPrefix}-${field}-error`;

  return (
    <form className="planning-budget-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      {mode === "create" ? (
        <Field
          error={errors.categoryId}
          errorId={fieldErrorId("categoryId")}
          htmlFor={fieldId("category")}
          label="Categoria"
        >
          <select
            aria-describedby={errors.categoryId ? fieldErrorId("categoryId") : undefined}
            aria-invalid={errors.categoryId ? true : undefined}
            disabled={isSubmitting}
            id={fieldId("category")}
            {...register("categoryId")}
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="planning-budget-form-static">
          <span>Categoria</span>
          <strong>{budget?.category.name}</strong>
          <input type="hidden" {...register("categoryId")} />
        </div>
      )}

      <div className="planning-budget-form-static">
        <span>Período</span>
        <strong>{formatPlanningPeriod(period)}</strong>
      </div>

      <div className="planning-budget-form-grid">
        <Field
          error={errors.limitAmount}
          errorId={fieldErrorId("limitAmount")}
          htmlFor={fieldId("limit")}
          label="Limite mensal"
        >
          <input
            aria-describedby={errors.limitAmount ? fieldErrorId("limitAmount") : undefined}
            aria-invalid={errors.limitAmount ? true : undefined}
            autoComplete="off"
            disabled={isSubmitting}
            id={fieldId("limit")}
            inputMode="decimal"
            placeholder="Ex.: 1200,50"
            type="text"
            {...register("limitAmount")}
          />
        </Field>

        <Field
          error={errors.warningPercentage}
          errorId={fieldErrorId("warningPercentage")}
          htmlFor={fieldId("warning")}
          label="Avisar em (%)"
        >
          <input
            aria-describedby={errors.warningPercentage ? fieldErrorId("warningPercentage") : undefined}
            aria-invalid={errors.warningPercentage ? true : undefined}
            disabled={isSubmitting}
            id={fieldId("warning")}
            max={100}
            min={1}
            type="number"
            {...register("warningPercentage", { valueAsNumber: true })}
          />
        </Field>
      </div>

      {submitError ? (
        <p className="planning-form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="planning-form-actions">
        <button className="secondary-button" disabled={isSubmitting} onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Salvando…" : mode === "create" ? "Criar orçamento" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  children: ReactNode;
  error?: FieldError;
  errorId: string;
  htmlFor: string;
  label: string;
};

function Field({ children, error, errorId, htmlFor, label }: FieldProps) {
  return (
    <label className="planning-field" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
      {error ? (
        <small className="field-error" id={errorId} role="alert">
          {error.message}
        </small>
      ) : null}
    </label>
  );
}
