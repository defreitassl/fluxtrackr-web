import { ArrowLeftRight, Pencil, SlidersHorizontal } from "lucide-react";

import type { Account } from "@/api/generated/client";
import { AccountAdjustmentHistory } from "@/features/wallet/adjustments/components/account-adjustment-history";
import { AccountTransferHistory } from "@/features/wallet/transfers/components/account-transfer-history";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { formatUtcDateTime } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type AccountDetailsProps = {
  walletAccount: WalletAccount | undefined;
  accounts: WalletAccount[];
  onAdjust: (walletAccount: WalletAccount) => void;
  onEdit: (account: Account) => void;
  onTransfer: (account: Account) => void;
};

export function AccountDetails({ accounts, onAdjust, onEdit, onTransfer, walletAccount }: AccountDetailsProps) {
  if (!walletAccount) {
    return null;
  }

  const { account, balance } = walletAccount;
  const values = [
    ["Saldo inicial", balance.initialBalance],
    ["Receitas", balance.income],
    ["Despesas", balance.expense],
    ["Transferências recebidas", balance.incomingTransfers],
    ["Transferências enviadas", balance.outgoingTransfers],
    ["Ajustes", balance.adjustments],
  ] as const;
  const canTransfer = accounts.length >= 2;

  return (
    <aside className="wallet-detail-panel" aria-labelledby="account-detail-title">
      <div className="wallet-detail-panel-header">
        <div>
          <p className="page-eyebrow">Detalhe da conta</p>
          <h3 id="account-detail-title">{account.name}</h3>
        </div>
        <div className="wallet-detail-actions">
          <button
            aria-describedby={canTransfer ? undefined : "account-transfer-unavailable"}
            className="secondary-button wallet-transfer-action"
            disabled={!canTransfer}
            onClick={() => onTransfer(account)}
            type="button"
          >
            <ArrowLeftRight aria-hidden="true" size={15} />
            Transferir
          </button>
          {!canTransfer ? <span className="sr-only" id="account-transfer-unavailable">Cadastre outra conta para realizar transferências.</span> : null}
          <button
            className="secondary-button wallet-adjustment-action"
            onClick={() => onAdjust(walletAccount)}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" size={15} />
            Ajustar saldo
          </button>
          <button className="secondary-button" onClick={() => onEdit(account)} type="button">
            <Pencil aria-hidden="true" size={15} />
            Editar conta
          </button>
        </div>
      </div>
      <p className="wallet-detail-caption">
        Composição retornada pela API até {formatUtcDateTime(balance.asOf)}.
      </p>
      <dl className="wallet-breakdown-list">
        {values.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{formatCurrency(value)}</dd>
          </div>
        ))}
        <div className="wallet-breakdown-total">
          <dt>Saldo atual</dt>
          <dd>{formatCurrency(balance.currentBalance)}</dd>
        </div>
      </dl>
      <section className="adjustment-history-section" aria-labelledby="account-transfer-history-title">
        <h4 id="account-transfer-history-title">Histórico de transferências</h4>
        <AccountTransferHistory accountId={account.id} accounts={accounts.map(({ account }) => account)} key={account.id} />
      </section>
      <section className="adjustment-history-section" aria-labelledby="account-adjustment-history-title">
        <h4 id="account-adjustment-history-title">Histórico de ajustes</h4>
        <AccountAdjustmentHistory accountId={account.id} key={account.id} />
      </section>
    </aside>
  );
}
