"use client";

import { ArrowLeftRight, MoreVertical, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Account } from "@/api/generated/client";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { getAccountIconComponent } from "@/features/wallet/lib/account-icons";
import { getAccountTypeLabel, isSafeHexColor } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

const updatedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function accountInitials(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function AccountMenu({
  account,
  onEdit,
  onAdjust,
  onTransfer,
}: {
  account: Account;
  onEdit: () => void;
  onAdjust: () => void;
  onTransfer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        aria-expanded={open}
        aria-label={`Ações de ${account.name}`}
        className="wlx-menu-button"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <MoreVertical aria-hidden="true" size={15} />
      </button>
      {open ? (
        <div className="wlx-menu" role="menu">
          <button onClick={() => run(onEdit)} role="menuitem" type="button">
            <Pencil aria-hidden="true" size={13} />
            Editar conta
          </button>
          <button onClick={() => run(onAdjust)} role="menuitem" type="button">
            <SlidersHorizontal aria-hidden="true" size={13} />
            Ajustar saldo
          </button>
          <button onClick={() => run(onTransfer)} role="menuitem" type="button">
            <ArrowLeftRight aria-hidden="true" size={13} />
            Transferir
          </button>
        </div>
      ) : null}
    </div>
  );
}

type WalletAccountsGridProps = {
  accounts: WalletAccount[];
  onCreateAccount: () => void;
  onEditAccount: (account: Account) => void;
  onAdjustAccount: (walletAccount: WalletAccount) => void;
  onTransferAccount: (account: Account) => void;
};

export function WalletAccountsGrid({
  accounts,
  onCreateAccount,
  onEditAccount,
  onAdjustAccount,
  onTransferAccount,
}: WalletAccountsGridProps) {
  return (
    <div className="wlx-accounts">
      {accounts.map((walletAccount) => {
        const { account, balance } = walletAccount;
        const Icon = getAccountIconComponent(account.icon);
        const hasCustomColor = isSafeHexColor(account.color);
        return (
          <div className="wlx-account-card" key={account.id}>
            <div className="wlx-account-head">
              <div className="wlx-account-id">
                <span
                  className="wlx-avatar"
                  style={hasCustomColor ? { background: account.color ?? undefined, color: "#fff" } : undefined}
                >
                  {account.icon ? <Icon aria-hidden="true" size={17} /> : accountInitials(account.name)}
                </span>
                <div>
                  <strong>{account.name}</strong>
                  <span>{account.bank ? `${getAccountTypeLabel(account.type)} · ${account.bank}` : getAccountTypeLabel(account.type)}</span>
                </div>
              </div>
              <AccountMenu
                account={account}
                onAdjust={() => onAdjustAccount(walletAccount)}
                onEdit={() => onEditAccount(account)}
                onTransfer={() => onTransferAccount(account)}
              />
            </div>
            <strong>{formatCurrency(balance.currentBalance)}</strong>
            <span className="wlx-account-note">
              Atualizado em {updatedAtFormatter.format(new Date(balance.asOf))}
            </span>
          </div>
        );
      })}
      <button className="wlx-add-tile" onClick={onCreateAccount} type="button">
        <span>
          <Plus aria-hidden="true" size={18} />
        </span>
        <span>Nova conta</span>
      </button>
    </div>
  );
}
