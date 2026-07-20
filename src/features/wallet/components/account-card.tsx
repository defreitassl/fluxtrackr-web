import { CircleDot } from "lucide-react";
import type { CSSProperties } from "react";

import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { accountIcons } from "@/features/wallet/lib/account-icons";
import { getAccountTypeLabel, isSafeHexColor } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type AccountCardProps = {
  walletAccount: WalletAccount;
  isSelected: boolean;
  onSelect: () => void;
};

export function AccountCard({ isSelected, onSelect, walletAccount }: AccountCardProps) {
  const { account, balance } = walletAccount;
  const AccountIcon = accountIcons[account.icon ?? ""] ?? CircleDot;
  const accent = isSafeHexColor(account.color) ? account.color : undefined;
  const style = accent ? ({ "--wallet-accent": accent } as CSSProperties) : undefined;

  return (
    <button
      aria-pressed={isSelected}
      className={`wallet-account-button${isSelected ? " is-selected" : ""}`}
      onClick={onSelect}
      style={style}
      type="button"
    >
      <span className="wallet-account-icon" aria-hidden="true">
        <AccountIcon size={19} />
      </span>
      <span className="wallet-item-copy">
        <strong>{account.name}</strong>
        <span>{account.bank ?? getAccountTypeLabel(account.type)}</span>
      </span>
      <span className="wallet-item-value">
        <strong>{formatCurrency(balance.currentBalance)}</strong>
        <span>{getAccountTypeLabel(account.type)}</span>
      </span>
    </button>
  );
}
