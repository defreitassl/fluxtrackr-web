"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { getAccountIconComponent } from "@/features/wallet/lib/account-icons";
import { ACCOUNT_TYPE_OPTIONS } from "@/features/wallet/lib/wallet-presentation";
import {
  accountFormSchema,
  ACCOUNT_COLOR_OPTIONS,
  ACCOUNT_ICON_OPTIONS,
  type AccountFormValues,
} from "@/features/wallet/accounts/schemas/account-form-schema";

type AccountFormProps = {
  mode: "create" | "edit";
  defaultValues: AccountFormValues;
  onSubmit: (values: AccountFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  idPrefix: string;
  formId: string;
};

export function AccountForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
  idPrefix,
  formId,
}: AccountFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  const selectedColor = watch("color");
  const selectedIcon = watch("icon");
  const colorOptions = buildColorOptions(selectedColor);

  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const errorId = (name: string) => `${idPrefix}-${name}-error`;

  return (
    <form className="account-form" id={formId} noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="account-form-grid">
        <label className="account-field" htmlFor={fieldId("name")}>
          <span>Nome</span>
          <input
            aria-describedby={errors.name ? errorId("name") : undefined}
            aria-invalid={errors.name ? true : undefined}
            autoComplete="off"
            disabled={isSubmitting}
            id={fieldId("name")}
            placeholder="Ex.: Conta corrente"
            type="text"
            {...register("name")}
          />
          {errors.name ? (
            <small className="field-error" id={errorId("name")} role="alert">
              {errors.name.message}
            </small>
          ) : null}
        </label>

        <label className="account-field" htmlFor={fieldId("bank")}>
          <span>Banco (opcional)</span>
          <input
            aria-describedby={errors.bank ? errorId("bank") : undefined}
            aria-invalid={errors.bank ? true : undefined}
            autoComplete="off"
            disabled={isSubmitting}
            id={fieldId("bank")}
            placeholder="Ex.: Banco Local"
            type="text"
            {...register("bank")}
          />
          {errors.bank ? (
            <small className="field-error" id={errorId("bank")} role="alert">
              {errors.bank.message}
            </small>
          ) : null}
        </label>

        <label className="account-field" htmlFor={fieldId("type")}>
          <span>Tipo</span>
          <select
            aria-describedby={errors.type ? errorId("type") : undefined}
            aria-invalid={errors.type ? true : undefined}
            disabled={isSubmitting}
            id={fieldId("type")}
            {...register("type")}
          >
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.type ? (
            <small className="field-error" id={errorId("type")} role="alert">
              {errors.type.message}
            </small>
          ) : null}
        </label>

        {mode === "create" ? (
          <label className="account-field" htmlFor={fieldId("initialBalance")}>
            <span>Saldo inicial</span>
            <input
              aria-describedby={errors.initialBalance ? errorId("initialBalance") : undefined}
              aria-invalid={errors.initialBalance ? true : undefined}
              autoComplete="off"
              disabled={isSubmitting}
              id={fieldId("initialBalance")}
              inputMode="decimal"
              placeholder="Ex.: 1000,50"
              type="text"
              {...register("initialBalance")}
            />
            {errors.initialBalance ? (
              <small className="field-error" id={errorId("initialBalance")} role="alert">
                {errors.initialBalance.message}
              </small>
            ) : null}
          </label>
        ) : (
          <p className="account-field account-form-note">
            O saldo inicial não pode ser alterado por esta tela. Correções de saldo serão feitas
            pelo fluxo de ajuste.
          </p>
        )}
      </div>

      <fieldset className="account-choice-group" disabled={isSubmitting}>
        <legend>Cor (opcional)</legend>
        <div aria-label="Cor da conta" className="account-swatch-list" role="radiogroup">
          <ChoiceButton
            checked={selectedColor === ""}
            label="Sem cor"
            onSelect={() => setValue("color", "", { shouldValidate: true, shouldDirty: true })}
          />
          {colorOptions.map((option) => (
            <ChoiceButton
              checked={selectedColor === option.value}
              key={option.value}
              label={option.label}
              onSelect={() =>
                setValue("color", option.value, { shouldValidate: true, shouldDirty: true })
              }
              swatch={option.value}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="account-choice-group" disabled={isSubmitting}>
        <legend>Ícone (opcional)</legend>
        <div aria-label="Ícone da conta" className="account-icon-list" role="radiogroup">
          <ChoiceButton
            checked={selectedIcon === ""}
            label="Sem ícone"
            onSelect={() => setValue("icon", "", { shouldValidate: true, shouldDirty: true })}
          />
          {ACCOUNT_ICON_OPTIONS.map((option) => {
            const Icon = getAccountIconComponent(option.value);
            return (
              <ChoiceButton
                checked={selectedIcon === option.value}
                icon={<Icon aria-hidden="true" size={16} />}
                key={option.value}
                label={option.label}
                onSelect={() =>
                  setValue("icon", option.value, { shouldValidate: true, shouldDirty: true })
                }
              />
            );
          })}
        </div>
      </fieldset>

      {submitError ? (
        <p className="account-form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="account-form-actions">
        <button
          className="secondary-button"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function ChoiceButton({
  checked,
  icon,
  label,
  onSelect,
  swatch,
}: {
  checked: boolean;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
  swatch?: string;
}) {
  return (
    <button
      aria-checked={checked}
      className={`account-choice${checked ? " is-selected" : ""}`}
      onClick={onSelect}
      role="radio"
      type="button"
    >
      {swatch ? (
        <span aria-hidden="true" className="account-choice-swatch" style={{ background: swatch }} />
      ) : null}
      {icon ? <span className="account-choice-icon">{icon}</span> : null}
      <span className="account-choice-label">{label}</span>
      {checked ? <Check aria-hidden="true" className="account-choice-check" size={14} /> : null}
    </button>
  );
}

/** Inclui a cor atual como opção extra quando ela não está na paleta padrão. */
function buildColorOptions(selectedColor: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = ACCOUNT_COLOR_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));
  if (selectedColor && !options.some((option) => option.value === selectedColor)) {
    options.push({ value: selectedColor, label: "Cor atual" });
  }
  return options;
}
