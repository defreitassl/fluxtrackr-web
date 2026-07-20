"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { BalanceAdjustmentFormValues } from "@/features/wallet/adjustments/schemas/balance-adjustment-form-schema";
import { balanceAdjustmentFormSchema } from "@/features/wallet/adjustments/schemas/balance-adjustment-form-schema";
import { formatCurrency } from "@/lib/format";

type BalanceAdjustmentFormProps = {
  accountName: string;
  currentBalance: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: BalanceAdjustmentFormValues) => void | Promise<void>;
  submitError: string | null;
};

export function BalanceAdjustmentForm({
  accountName,
  currentBalance,
  isSubmitting,
  onCancel,
  onSubmit,
  submitError,
}: BalanceAdjustmentFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<BalanceAdjustmentFormValues>({
    resolver: zodResolver(balanceAdjustmentFormSchema),
    defaultValues: { newBalance: "", reason: "" },
  });

  return (
    <form className="account-form balance-adjustment-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="balance-adjustment-context">
        <span>Conta selecionada</span>
        <strong>{accountName}</strong>
        <span>Saldo atual retornado pela API</span>
        <strong>{formatCurrency(currentBalance)}</strong>
      </div>

      <label className="account-field" htmlFor="balance-adjustment-new-balance">
        <span>Novo saldo</span>
        <input
          aria-describedby={errors.newBalance ? "balance-adjustment-new-balance-error" : undefined}
          aria-invalid={errors.newBalance ? true : undefined}
          autoComplete="off"
          data-dialog-initial-focus
          disabled={isSubmitting}
          id="balance-adjustment-new-balance"
          inputMode="decimal"
          placeholder="Ex.: 1500,00"
          type="text"
          {...register("newBalance")}
        />
        {errors.newBalance ? (
          <small className="field-error" id="balance-adjustment-new-balance-error" role="alert">
            {errors.newBalance.message}
          </small>
        ) : null}
      </label>

      <label className="account-field" htmlFor="balance-adjustment-reason">
        <span>Motivo (opcional)</span>
        <textarea
          disabled={isSubmitting}
          id="balance-adjustment-reason"
          placeholder="Ex.: Conferência bancária"
          rows={3}
          {...register("reason")}
        />
      </label>

      <p className="balance-adjustment-note">
        Este ajuste não altera o saldo inicial e não cria uma receita ou despesa.
      </p>

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
          {isSubmitting ? "Ajustando…" : "Confirmar ajuste"}
        </button>
      </div>
    </form>
  );
}
