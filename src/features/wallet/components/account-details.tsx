import { Pencil, SlidersHorizontal } from "lucide-react";

import type { Account } from "@/api/generated/client";
import { AccountAdjustmentHistory } from "@/features/wallet/adjustments/components/account-adjustment-history";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { formatUtcDateTime } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type AccountDetailsProps = {
  walletAccount: WalletAccount | undefined;
  onAdjust: (walletAccount: WalletAccount) => void;
  onEdit: (account: Account) => void;
};

export function AccountDetails({ onAdjust, onEdit, walletAccount }: AccountDetailsProps) {
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

  return (
    <aside className="wallet-detail-panel" aria-labelledby="account-detail-title">
      <div className="wallet-detail-panel-header">
        <div>
          <p className="page-eyebrow">Detalhe da conta</p>
          <h3 id="account-detail-title">{account.name}</h3>
        </div>
        <div className="wallet-detail-actions">
          <button className="secondary-button" onClick={() => onEdit(account)} type="button">
            <Pencil aria-hidden="true" size={15} />
            Editar conta
          </button>
          <button
            className="secondary-button wallet-adjustment-action"
            onClick={() => onAdjust(walletAccount)}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" size={15} />
            Ajustar saldo
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
      <section className="adjustment-history-section" aria-labelledby="account-adjustment-history-title">
        <h4 id="account-adjustment-history-title">Histórico de ajustes</h4>
        <AccountAdjustmentHistory accountId={account.id} key={account.id} />
      </section>
    </aside>
  );
}
