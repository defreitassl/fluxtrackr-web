"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import type { AccountTransferFormValues } from "@/features/wallet/transfers/schemas/account-transfer-form-schema";
import { accountTransferFormSchema } from "@/features/wallet/transfers/schemas/account-transfer-form-schema";
import { formatCurrency } from "@/lib/format";

type AccountTransferFormProps = {
  accounts: WalletAccount[];
  initialSourceAccountId: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: AccountTransferFormValues) => void | Promise<void>;
  submitError: string | null;
};

export function AccountTransferForm({
  accounts,
  initialSourceAccountId,
  isSubmitting,
  onCancel,
  onSubmit,
  submitError,
}: AccountTransferFormProps) {
  const initialDestinationAccountId = accounts.find(({ account }) => account.id !== initialSourceAccountId)?.account.id ?? "";
  const { control, formState: { errors }, handleSubmit, register, setValue } = useForm<AccountTransferFormValues>({
    resolver: zodResolver(accountTransferFormSchema),
    defaultValues: {
      sourceAccountId: initialSourceAccountId,
      destinationAccountId: initialDestinationAccountId,
      amount: "",
      description: "",
    },
  });
  const sourceAccountId = useWatch({ control, name: "sourceAccountId" });
  const destinationAccounts = accounts.filter(({ account }) => account.id !== sourceAccountId);
  const sourceAccount = accounts.find(({ account }) => account.id === sourceAccountId);
  const sourceRegistration = register("sourceAccountId", {
    onChange: (event) => {
      const nextSourceId = event.target.value;
      setValue("destinationAccountId", accounts.find(({ account }) => account.id !== nextSourceId)?.account.id ?? "", {
        shouldValidate: true,
      });
    },
  });

  return (
    <form className="account-form account-transfer-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="balance-adjustment-context">
        <span>Saldo atual da origem retornado pela API</span>
        <strong>{sourceAccount ? formatCurrency(sourceAccount.balance.currentBalance) : "—"}</strong>
      </div>
      <label className="account-field" htmlFor="account-transfer-source">
        <span>Conta de origem</span>
        <select disabled={isSubmitting} id="account-transfer-source" {...sourceRegistration}>
          {accounts.map(({ account }) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </select>
      </label>
      <label className="account-field" htmlFor="account-transfer-destination">
        <span>Conta de destino</span>
        <select aria-invalid={errors.destinationAccountId ? true : undefined} disabled={isSubmitting} id="account-transfer-destination" {...register("destinationAccountId")}>
          {destinationAccounts.map(({ account }) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </select>
        {errors.destinationAccountId ? <small className="field-error" role="alert">{errors.destinationAccountId.message}</small> : null}
      </label>
      <label className="account-field" htmlFor="account-transfer-amount">
        <span>Valor</span>
        <input aria-invalid={errors.amount ? true : undefined} autoComplete="off" data-dialog-initial-focus disabled={isSubmitting} id="account-transfer-amount" inputMode="decimal" placeholder="Ex.: 250,00" type="text" {...register("amount")} />
        {errors.amount ? <small className="field-error" role="alert">{errors.amount.message}</small> : null}
      </label>
      <label className="account-field" htmlFor="account-transfer-description">
        <span>Descrição (opcional)</span>
        <textarea disabled={isSubmitting} id="account-transfer-description" placeholder="Ex.: Reserva mensal" rows={3} {...register("description")} />
      </label>
      <p className="balance-adjustment-note">A transferência apenas redistribui o saldo e não será registrada como receita ou despesa.</p>
      {submitError ? <p className="account-form-error" role="alert">{submitError}</p> : null}
      <div className="account-form-actions">
        <button className="secondary-button" disabled={isSubmitting} onClick={onCancel} type="button">Cancelar</button>
        <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? "Transferindo…" : "Confirmar transferência"}</button>
      </div>
    </form>
  );
}
