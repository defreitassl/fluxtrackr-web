"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldError } from "react-hook-form";

import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import {
  creditCardFormSchema,
  type CreditCardFormValues,
} from "@/features/wallet/credit-cards/schemas/credit-card-form-schema";

type CreditCardFormProps = {
  accounts: WalletAccount[];
  defaultValues: CreditCardFormValues;
  formId: string;
  idPrefix: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: CreditCardFormValues) => void | Promise<void>;
  submitError: string | null;
};

export function CreditCardForm({
  accounts,
  defaultValues,
  formId,
  idPrefix,
  isSubmitting,
  onCancel,
  onSubmit,
  submitError,
}: CreditCardFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardFormSchema),
    defaultValues,
  });

  const fieldId = (name: keyof CreditCardFormValues) => `${idPrefix}-${name}`;
  const errorId = (name: keyof CreditCardFormValues) => `${fieldId(name)}-error`;
  const inputProps = (name: keyof CreditCardFormValues, error?: FieldError) => ({
    "aria-describedby": error ? errorId(name) : undefined,
    "aria-invalid": error ? true : undefined,
    disabled: isSubmitting,
    id: fieldId(name),
  });

  return (
    <form className="account-form" id={formId} noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="account-form-grid">
        <label className="account-field" htmlFor={fieldId("name")}>
          <span>Nome do cartão</span>
          <input
            autoComplete="off"
            data-dialog-initial-focus
            placeholder="Ex.: Cartão principal"
            type="text"
            {...inputProps("name", errors.name)}
            {...register("name")}
          />
          <FieldErrorMessage error={errors.name} id={errorId("name")} />
        </label>

        <label className="account-field" htmlFor={fieldId("accountId")}>
          <span>Conta vinculada (opcional)</span>
          <select {...inputProps("accountId", errors.accountId)} {...register("accountId")}>
            <option value="">Sem conta vinculada</option>
            {accounts.map(({ account }) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <FieldErrorMessage error={errors.accountId} id={errorId("accountId")} />
        </label>

        <label className="account-field" htmlFor={fieldId("bankName")}>
          <span>Banco (opcional)</span>
          <input
            autoComplete="off"
            placeholder="Ex.: Banco Local"
            type="text"
            {...inputProps("bankName", errors.bankName)}
            {...register("bankName")}
          />
          <FieldErrorMessage error={errors.bankName} id={errorId("bankName")} />
        </label>

        <label className="account-field" htmlFor={fieldId("brand")}>
          <span>Bandeira (opcional)</span>
          <input
            autoComplete="off"
            placeholder="Ex.: Visa"
            type="text"
            {...inputProps("brand", errors.brand)}
            {...register("brand")}
          />
          <FieldErrorMessage error={errors.brand} id={errorId("brand")} />
        </label>

        <label className="account-field" htmlFor={fieldId("lastFourDigits")}>
          <span>Quatro últimos dígitos (opcional)</span>
          <input
            autoComplete="off"
            inputMode="numeric"
            maxLength={4}
            placeholder="Ex.: 1234"
            type="text"
            {...inputProps("lastFourDigits", errors.lastFourDigits)}
            {...register("lastFourDigits")}
          />
          <FieldErrorMessage error={errors.lastFourDigits} id={errorId("lastFourDigits")} />
        </label>

        <label className="account-field" htmlFor={fieldId("limitAmount")}>
          <span>Limite configurado</span>
          <input
            autoComplete="off"
            inputMode="decimal"
            placeholder="Ex.: 3000,00"
            type="text"
            {...inputProps("limitAmount", errors.limitAmount)}
            {...register("limitAmount")}
          />
          <FieldErrorMessage error={errors.limitAmount} id={errorId("limitAmount")} />
        </label>

        <label className="account-field" htmlFor={fieldId("closingDay")}>
          <span>Dia de fechamento (opcional)</span>
          <input
            inputMode="numeric"
            max={31}
            min={1}
            placeholder="Ex.: 10"
            type="number"
            {...inputProps("closingDay", errors.closingDay)}
            {...register("closingDay")}
          />
          <FieldErrorMessage error={errors.closingDay} id={errorId("closingDay")} />
        </label>

        <label className="account-field" htmlFor={fieldId("dueDay")}>
          <span>Dia de vencimento</span>
          <input
            inputMode="numeric"
            max={31}
            min={1}
            placeholder="Ex.: 17"
            type="number"
            {...inputProps("dueDay", errors.dueDay)}
            {...register("dueDay")}
          />
          <FieldErrorMessage error={errors.dueDay} id={errorId("dueDay")} />
        </label>

        <label className="account-field" htmlFor={fieldId("color")}>
          <span>Cor hexadecimal (opcional)</span>
          <input
            autoComplete="off"
            placeholder="Ex.: #2563eb"
            type="text"
            {...inputProps("color", errors.color)}
            {...register("color")}
          />
          <FieldErrorMessage error={errors.color} id={errorId("color")} />
        </label>
      </div>

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
    </form>
  );
}

function FieldErrorMessage({ error, id }: { error?: FieldError; id: string }) {
  return error ? (
    <small className="field-error" id={id} role="alert">
      {error.message}
    </small>
  ) : null;
}
