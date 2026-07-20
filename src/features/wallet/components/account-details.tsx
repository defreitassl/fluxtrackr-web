import { Pencil } from "lucide-react";

import type { Account } from "@/api/generated/client";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { formatUtcDateTime } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type AccountDetailsProps = {
  walletAccount: WalletAccount | undefined;
  onEdit: (account: Account) => void;
};

export function AccountDetails({ onEdit, walletAccount }: AccountDetailsProps) {
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
        <button className="secondary-button" onClick={() => onEdit(account)} type="button">
          <Pencil aria-hidden="true" size={15} />
          Editar conta
        </button>
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
    </aside>
  );
}
