"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldError } from "react-hook-form";
import { useState } from "react";

import type {
  CreditCard,
  CreditCardInvoiceWithInstallments,
  PaidCreditCardInvoice,
} from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { getCreditCardErrorMessage } from "@/features/wallet/credit-cards/lib/credit-card-error-message";
import {
  defaultPayCreditCardInvoiceFormValues,
  toPayCreditCardInvoicePayload,
} from "@/features/wallet/credit-cards/lib/pay-credit-card-invoice-form-mappers";
import { usePayCreditCardInvoice } from "@/features/wallet/credit-cards/mutations/use-pay-credit-card-invoice";
import {
  payCreditCardInvoiceFormSchema,
  type PayCreditCardInvoiceFormValues,
} from "@/features/wallet/credit-cards/schemas/pay-credit-card-invoice-form-schema";
import { formatUtcDate } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type PayCreditCardInvoiceDialogProps = {
  accounts: WalletAccount[];
  card: CreditCard | null;
  invoice: CreditCardInvoiceWithInstallments | null;
  onClose: () => void;
  onPaid: (invoice: PaidCreditCardInvoice) => void;
  open: boolean;
};

export function PayCreditCardInvoiceDialog({
  accounts,
  card,
  invoice,
  onClose,
  onPaid,
  open,
}: PayCreditCardInvoiceDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = usePayCreditCardInvoice();

  if (!invoice) {
    return null;
  }

  const invoiceToPay = invoice;

  async function handleSubmit(values: PayCreditCardInvoiceFormValues) {
    setSubmitError(null);
    try {
      const paid = await mutation.mutateAsync({
        id: invoiceToPay.id,
        payload: toPayCreditCardInvoicePayload(values),
      });
      onPaid(paid);
    } catch (error) {
      setSubmitError(getCreditCardErrorMessage(error, "pay"));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="O pagamento será integral. A API criará a transação bancária correspondente."
      descriptionId="pay-credit-card-invoice-description"
      initialFocusSelector="#pay-credit-card-invoice-accountId"
      onClose={onClose}
      open={open}
      title="Pagar fatura"
      titleId="pay-credit-card-invoice-title"
    >
      <PayCreditCardInvoiceForm
        accounts={accounts}
        card={card}
        defaultValues={defaultPayCreditCardInvoiceFormValues(invoiceToPay, accounts)}
        invoice={invoiceToPay}
        isSubmitting={mutation.isPending}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </Dialog>
  );
}

type PayCreditCardInvoiceFormProps = {
  accounts: WalletAccount[];
  card: CreditCard | null;
  defaultValues: PayCreditCardInvoiceFormValues;
  invoice: CreditCardInvoiceWithInstallments;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: PayCreditCardInvoiceFormValues) => void | Promise<void>;
  submitError: string | null;
};

function PayCreditCardInvoiceForm({
  accounts,
  card,
  defaultValues,
  invoice,
  isSubmitting,
  onCancel,
  onSubmit,
  submitError,
}: PayCreditCardInvoiceFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<PayCreditCardInvoiceFormValues>({
    resolver: zodResolver(payCreditCardInvoiceFormSchema),
    defaultValues,
  });

  const fieldId = (name: keyof PayCreditCardInvoiceFormValues) => `pay-credit-card-invoice-${name}`;
  const errorId = (name: keyof PayCreditCardInvoiceFormValues) => `${fieldId(name)}-error`;
  const inputProps = (name: keyof PayCreditCardInvoiceFormValues, error?: FieldError) => ({
    "aria-describedby": error ? errorId(name) : undefined,
    "aria-invalid": error ? true : undefined,
    disabled: isSubmitting,
    id: fieldId(name),
  });

  return (
    <form className="account-form" id="pay-credit-card-invoice-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <dl className="wallet-breakdown-list">
        <div>
          <dt>Cartão</dt>
          <dd>
            {card
              ? `${card.name}${card.lastFourDigits ? ` · •••• ${card.lastFourDigits}` : ""}`
              : "Cartão arquivado ou indisponível"}
          </dd>
        </div>
        <div>
          <dt>Período</dt>
          <dd>{String(invoice.month).padStart(2, "0")}/{invoice.year}</dd>
        </div>
        <div>
          <dt>Valor integral</dt>
          <dd>{formatCurrency(invoice.totalAmount)}</dd>
        </div>
        <div>
          <dt>Vencimento</dt>
          <dd>{formatUtcDate(invoice.dueDate)}</dd>
        </div>
      </dl>
      <div className="account-form-grid">
        <label className="account-field" htmlFor={fieldId("accountId")}>
          <span>Conta do pagamento</span>
          <select
            data-dialog-initial-focus
            {...inputProps("accountId", errors.accountId)}
            {...register("accountId")}
          >
            <option value="">Selecione uma conta</option>
            {accounts.map(({ account }) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <FieldErrorMessage error={errors.accountId} id={errorId("accountId")} />
        </label>
        <label className="account-field" htmlFor={fieldId("paidAt")}>
          <span>Data e hora do pagamento (opcional)</span>
          <input
            type="datetime-local"
            {...inputProps("paidAt", errors.paidAt)}
            {...register("paidAt")}
          />
          <FieldErrorMessage error={errors.paidAt} id={errorId("paidAt")} />
        </label>
      </div>
      {accounts.length === 0 ? (
        <p className="account-form-note" role="alert">
          Crie uma conta ativa antes de pagar a fatura.
        </p>
      ) : null}
      {submitError ? (
        <p className="account-form-error" role="alert">
          {submitError}
        </p>
      ) : null}
      <div className="account-form-actions">
        <button className="secondary-button" disabled={isSubmitting} onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="primary-button" disabled={isSubmitting || accounts.length === 0} type="submit">
          {isSubmitting ? "Pagando…" : "Pagar integralmente"}
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
