"use client";

import { CreditCard, Landmark, Wallet } from "lucide-react";

import type { DashboardOverview } from "@/api/generated/client";
import type { WalletOverview } from "@/features/wallet/api/get-wallet-overview";
import { formatCurrency } from "@/lib/format";

const payableStatuses = new Set(["open", "closed", "overdue"]);

type WalletTilesProps = {
  overview: WalletOverview;
  dashboard: DashboardOverview | undefined;
};

export function WalletTiles({ overview, dashboard }: WalletTilesProps) {
  const accountsTotal = overview.accounts.reduce(
    (total, { balance }) => total + Number(balance.currentBalance),
    0,
  );
  const openInvoicesTotal = overview.invoices
    .filter((invoice) => payableStatuses.has(invoice.status))
    .reduce((total, invoice) => total + Number(invoice.totalAmount), 0);

  return (
    <div className="wlx-summary">
      <div className="wlx-tile">
        <div className="wlx-tile-label">
          <Landmark aria-hidden="true" color="var(--green-strong)" size={15} />
          Saldo em contas
        </div>
        <strong>{formatCurrency(accountsTotal)}</strong>
      </div>
      <div className="wlx-tile">
        <div className="wlx-tile-label">
          <CreditCard aria-hidden="true" color="var(--amber)" size={15} />
          Faturas em aberto
        </div>
        <strong className="tlx-value-red">{formatCurrency(openInvoicesTotal)}</strong>
      </div>
      <div className="wlx-tile wlx-tile-available">
        <div className="wlx-tile-label">
          <Wallet aria-hidden="true" size={15} />
          Disponível
        </div>
        <strong>{dashboard ? formatCurrency(dashboard.balance.availableToSpend) : "—"}</strong>
      </div>
    </div>
  );
}
