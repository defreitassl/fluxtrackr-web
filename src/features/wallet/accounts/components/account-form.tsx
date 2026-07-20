"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import {
  useForm,
  useWatch,
  type FieldError,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { getAccountIconComponent } from "@/features/wallet/lib/account-icons";
import { ACCOUNT_TYPE_OPTIONS } from "@/features/wallet/lib/wallet-presentation";
import {
  ACCOUNT_COLOR_OPTIONS,
  ACCOUNT_ICON_OPTIONS,
  createAccountFormSchema,
  editAccountFormSchema,
  type AccountMetadataFormValues,
  type CreateAccountFormValues,
  type EditAccountFormValues,
} from "@/features/wallet/accounts/schemas/account-form-schema";

type FormBaseProps = {
  onCancel: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  idPrefix: string;
  formId: string;
};

type CreateAccountFormProps = FormBaseProps & {
  mode: "create";
  defaultValues: CreateAccountFormValues;
  onSubmit: (values: CreateAccountFormValues) => void | Promise<void>;
};

type EditAccountFormProps = FormBaseProps & {
  mode: "edit";
  defaultValues: EditAccountFormValues;
  onSubmit: (values: EditAccountFormValues) => void | Promise<void>;
};

type AccountFormProps = CreateAccountFormProps | EditAccountFormProps;

export function AccountForm(props: AccountFormProps) {
  return props.mode === "create" ? (
    <CreateAccountForm {...props} />
  ) : (
    <EditAccountForm {...props} />
  );
}

function CreateAccountForm({
  defaultValues,
  formId,
  idPrefix,
  isSubmitting,
  onCancel,
  onSubmit,
  submitError,
}: CreateAccountFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues,
  });
  const selectedColor = useWatch({ control, name: "color" });
  const selectedIcon = useWatch({ control, name: "icon" });

  return (
    <form className="account-form" id={formId} noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="account-form-grid">
        <AccountMetadataFields
          errors={errors}
          idPrefix={idPrefix}
          isSubmitting={isSubmitting}
          registrations={{
            name: register("name"),
            bank: register("bank"),
            type: register("type"),
            color: register("color"),
            icon: register("icon"),
          }}
        />
        <label className="account-field" htmlFor={`${idPrefix}-initialBalance`}>
          <span>Saldo inicial</span>
          <input
            aria-describedby={errors.initialBalance ? `${idPrefix}-initialBalance-error` : undefined}
            aria-invalid={errors.initialBalance ? true : undefined}
            autoComplete="off"
            disabled={isSubmitting}
            id={`${idPrefix}-initialBalance`}
            inputMode="decimal"
            placeholder="Ex.: 1000,50"
            type="text"
            {...register("initialBalance")}
          />
          {errors.initialBalance ? (
            <small className="field-error" id={`${idPrefix}-initialBalance-error`} role="alert">
              {errors.initialBalance.message}
            </small>
          ) : null}
        </label>
      </div>
      <AccountChoiceGroups
        idPrefix={idPrefix}
        isSubmitting={isSubmitting}
        registrations={{ color: register("color"), icon: register("icon") }}
        selectedColor={selectedColor}
        selectedIcon={selectedIcon}
      />
      <AccountFormStatus isSubmitting={isSubmitting} onCancel={onCancel} submitError={submitError} />
    </form>
  );
}

function EditAccountForm({
  defaultValues,
  formId,
  idPrefix,
  isSubmitting,
  onCancel,
  onSubmit,
  submitError,
}: EditAccountFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountFormSchema),
    defaultValues,
  });
  const selectedColor = useWatch({ control, name: "color" });
  const selectedIcon = useWatch({ control, name: "icon" });

  return (
    <form className="account-form" id={formId} noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="account-form-grid">
        <AccountMetadataFields
          errors={errors}
          idPrefix={idPrefix}
          isSubmitting={isSubmitting}
          registrations={{
            name: register("name"),
            bank: register("bank"),
            type: register("type"),
            color: register("color"),
            icon: register("icon"),
          }}
        />
        <p className="account-field account-form-note">
          O saldo inicial não pode ser alterado por esta tela. Correções de saldo serão feitas
          pelo fluxo de ajuste.
        </p>
      </div>
      <AccountChoiceGroups
        idPrefix={idPrefix}
        isSubmitting={isSubmitting}
        registrations={{ color: register("color"), icon: register("icon") }}
        selectedColor={selectedColor}
        selectedIcon={selectedIcon}
      />
      <AccountFormStatus isSubmitting={isSubmitting} onCancel={onCancel} submitError={submitError} />
    </form>
  );
}

type MetadataRegistrations = Record<keyof AccountMetadataFormValues, UseFormRegisterReturn>;
type MetadataErrors = Partial<Record<keyof AccountMetadataFormValues, FieldError>>;

type AccountMetadataFieldsProps = {
  idPrefix: string;
  isSubmitting: boolean;
  registrations: MetadataRegistrations;
  errors: MetadataErrors;
};

function AccountMetadataFields({ idPrefix, isSubmitting, registrations, errors }: AccountMetadataFieldsProps) {
  const fieldId = (name: keyof AccountMetadataFormValues) => `${idPrefix}-${name}`;
  const errorId = (name: keyof AccountMetadataFormValues) => `${idPrefix}-${name}-error`;

  return (
    <>
      <label className="account-field" htmlFor={fieldId("name")}>
        <span>Nome</span>
        <input
          aria-describedby={errors.name ? errorId("name") : undefined}
          aria-invalid={errors.name ? true : undefined}
          autoComplete="off"
          data-dialog-initial-focus
          disabled={isSubmitting}
          id={fieldId("name")}
          placeholder="Ex.: Conta corrente"
          type="text"
          {...registrations.name}
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
          {...registrations.bank}
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
          {...registrations.type}
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
    </>
  );
}

type AccountChoiceGroupsProps = {
  idPrefix: string;
  isSubmitting: boolean;
  registrations: Pick<MetadataRegistrations, "color" | "icon">;
  selectedColor: string;
  selectedIcon: string;
};

function AccountChoiceGroups({
  idPrefix,
  isSubmitting,
  registrations,
  selectedColor,
  selectedIcon,
}: AccountChoiceGroupsProps) {
  const colorOptions = buildColorOptions(selectedColor);

  return (
    <>
      <fieldset className="account-choice-group" disabled={isSubmitting}>
        <legend>Cor (opcional)</legend>
        <div className="account-swatch-list">
          <ChoiceRadio
            checked={selectedColor === ""}
            id={`${idPrefix}-color-none`}
            label="Sem cor"
            registration={registrations.color}
            value=""
          />
          {colorOptions.map((option) => (
            <ChoiceRadio
              checked={selectedColor === option.value}
              id={`${idPrefix}-color-${option.value.slice(1)}`}
              key={option.value}
              label={option.label}
              registration={registrations.color}
              swatch={option.value}
              value={option.value}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="account-choice-group" disabled={isSubmitting}>
        <legend>Ícone (opcional)</legend>
        <div className="account-icon-list">
          <ChoiceRadio
            checked={selectedIcon === ""}
            id={`${idPrefix}-icon-none`}
            label="Sem ícone"
            registration={registrations.icon}
            value=""
          />
          {ACCOUNT_ICON_OPTIONS.map((option) => {
            const Icon = getAccountIconComponent(option.value);
            return (
              <ChoiceRadio
                checked={selectedIcon === option.value}
                icon={<Icon aria-hidden="true" size={16} />}
                id={`${idPrefix}-icon-${option.value}`}
                key={option.value}
                label={option.label}
                registration={registrations.icon}
                value={option.value}
              />
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

function ChoiceRadio({
  checked,
  icon,
  id,
  label,
  registration,
  swatch,
  value,
}: {
  checked: boolean;
  icon?: ReactNode;
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  swatch?: string;
  value: string;
}) {
  return (
    <label className={`account-choice${checked ? " is-selected" : ""}`} htmlFor={id}>
      <input className="account-choice-input" id={id} type="radio" value={value} {...registration} />
      {swatch ? (
        <span aria-hidden="true" className="account-choice-swatch" style={{ background: swatch }} />
      ) : null}
      {icon ? <span className="account-choice-icon">{icon}</span> : null}
      <span className="account-choice-label">{label}</span>
      {checked ? <Check aria-hidden="true" className="account-choice-check" size={14} /> : null}
    </label>
  );
}

function AccountFormStatus({
  isSubmitting,
  onCancel,
  submitError,
}: Pick<FormBaseProps, "isSubmitting" | "onCancel" | "submitError">) {
  return (
    <>
      {submitError ? (
        <p className="account-form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="account-form-actions">
        <button className="secondary-button" disabled={isSubmitting} onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </>
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
