import { Landmark, Plus } from "lucide-react";

import type { Account } from "@/api/generated/client";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { AccountCard } from "@/features/wallet/components/account-card";
import { AccountDetails } from "@/features/wallet/components/account-details";
import { InlineEmpty } from "@/features/wallet/components/wallet-empty-states";
import { WalletSectionHeading } from "@/features/wallet/components/wallet-section-heading";

type AccountsSectionProps = {
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | undefined;
  successMessage: string | null;
  onSelectAccount: (id: string) => void;
  onCreateAccount: () => void;
  onAdjustAccount: (walletAccount: WalletAccount) => void;
  onEditAccount: (account: Account) => void;
};

export function AccountsSection({
  accounts,
  selectedAccount,
  successMessage,
  onSelectAccount,
  onCreateAccount,
  onAdjustAccount,
  onEditAccount,
}: AccountsSectionProps) {
  return (
    <section className="wallet-section wallet-accounts-section" aria-labelledby="wallet-accounts-title">
      <WalletSectionHeading
        action={
          <button className="primary-button wallet-inline-action" onClick={onCreateAccount} type="button">
            <Plus aria-hidden="true" size={16} />
            Nova conta
          </button>
        }
        count={accounts.length}
        id="wallet-accounts-title"
        title="Contas ativas"
      />

      {successMessage ? (
        <p className="wallet-success" role="status">
          {successMessage}
        </p>
      ) : null}

      {accounts.length === 0 ? (
        <InlineEmpty icon={Landmark} message="Nenhuma conta ativa foi retornada pela API." />
      ) : (
        <div className="wallet-account-layout">
          <ul className="wallet-account-list">
            {accounts.map((walletAccount) => (
              <li key={walletAccount.account.id}>
                <AccountCard
                  isSelected={selectedAccount?.account.id === walletAccount.account.id}
                  onSelect={() => onSelectAccount(walletAccount.account.id)}
                  walletAccount={walletAccount}
                />
              </li>
            ))}
          </ul>
          <AccountDetails
            onAdjust={onAdjustAccount}
            onEdit={onEditAccount}
            walletAccount={selectedAccount}
          />
        </div>
      )}
    </section>
  );
}
