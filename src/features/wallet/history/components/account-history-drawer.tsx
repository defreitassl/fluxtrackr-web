"use client";

import { ArrowDownLeft, ArrowUpRight, History, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Account } from "@/api/generated/client";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import {
  ACCOUNT_HISTORY_PAGE_SIZE,
  getVisibleAccountHistoryEntries,
  hasMoreAccountHistoryEntries,
  type AccountHistoryEntry,
} from "@/features/wallet/history/lib/account-history";
import { useAccountHistory } from "@/features/wallet/history/queries/use-account-history";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { formatUtcDateTime } from "@/features/wallet/lib/wallet-presentation";

type AccountHistoryDrawerProps = {
  account: Account | null;
  accounts: WalletAccount[];
  onClose: () => void;
  open: boolean;
};

function oppositeAccountName(entry: Extract<AccountHistoryEntry, { type: "transfer_in" | "transfer_out" }>, accounts: WalletAccount[]) {
  const accountId = entry.type === "transfer_out"
    ? entry.transfer.destinationAccountId
    : entry.transfer.sourceAccountId;
  return accounts.find((candidate) => candidate.account.id === accountId)?.account.name ?? "Conta indisponível";
}

function HistoryRow({ entry, accounts }: { entry: AccountHistoryEntry; accounts: WalletAccount[] }) {
  if (entry.type === "adjustment") {
    const { adjustment } = entry;
    const difference = Number(adjustment.difference);
    return (
      <article className="wlx-history-item">
        <span className="wlx-history-icon"><SlidersHorizontal aria-hidden="true" size={15} /></span>
        <div>
          <strong>Ajuste de saldo</strong>
          <span>{formatUtcDateTime(adjustment.occurredAt)}</span>
          <small>{adjustment.reason ?? "Sem motivo informado"}</small>
        </div>
        <div className="wlx-history-value">
          <b className={difference < 0 ? "wlx-history-negative" : "wlx-history-positive"}>{difference > 0 ? "+" : ""}{formatCurrency(adjustment.difference)}</b>
          <span>{formatCurrency(adjustment.previousBalance)} → {formatCurrency(adjustment.newBalance)}</span>
        </div>
      </article>
    );
  }

  const isOutgoing = entry.type === "transfer_out";
  return (
    <article className="wlx-history-item">
      <span className="wlx-history-icon">
        {isOutgoing ? <ArrowUpRight aria-hidden="true" size={16} /> : <ArrowDownLeft aria-hidden="true" size={16} />}
      </span>
      <div>
        <strong>{isOutgoing ? "Transferência enviada" : "Transferência recebida"}</strong>
        <span>{formatUtcDateTime(entry.transfer.occurredAt)} · {oppositeAccountName(entry, accounts)}</span>
        <small>{entry.transfer.description ?? "Sem descrição"}</small>
      </div>
      <div className="wlx-history-value">
        <b className={isOutgoing ? "wlx-history-negative" : "wlx-history-positive"}>{isOutgoing ? "−" : "+"}{formatCurrency(entry.transfer.amount)}</b>
      </div>
    </article>
  );
}

export function AccountHistoryDrawer({ account, accounts, onClose, open }: AccountHistoryDrawerProps) {
  const history = useAccountHistory(open ? account?.id ?? null : null);
  const session = open ? account?.id ?? null : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ACCOUNT_HISTORY_PAGE_SIZE);

  if (session !== lastSession) {
    setLastSession(session);
    setVisibleCount(ACCOUNT_HISTORY_PAGE_SIZE);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const visibleEntries = useMemo(
    () => getVisibleAccountHistoryEntries(history.data, visibleCount),
    [history.data, visibleCount],
  );
  const hasMore = hasMoreAccountHistoryEntries(history.data, visibleCount);

  return (
    <>
      <div aria-hidden="true" className={cn("txx-backdrop", open && "txx-backdrop-open")} onClick={onClose} />
      <aside aria-hidden={!open} aria-label="Histórico da conta" className={cn("txx-drawer", open && "txx-drawer-open")} role="dialog">
        <div className="txx-drawer-head">
          <div>
            <strong>Histórico da conta</strong>
            <p>{account?.name ?? "Conta"} · transferências e ajustes</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button"><X aria-hidden="true" size={15} /></button>
        </div>
        <div className="txx-drawer-body">
          {history.isPending ? <div aria-busy="true" className="wlx-history-skeleton" role="status"><span /><span /><span /></div> : null}
          {history.isError && !history.isPending ? <div className="wlx-history-state" role="alert"><strong>Não foi possível carregar o histórico.</strong><p>Feche e abra novamente para tentar atualizar.</p></div> : null}
          {!history.isPending && !history.isError && history.data.length === 0 ? (
            <div className="wlx-history-state"><History aria-hidden="true" size={22} /><strong>Sem histórico por enquanto</strong><p>Transferências e ajustes desta conta aparecerão aqui.</p></div>
          ) : null}
          {!history.isPending && !history.isError && history.data.length > 0 ? (
            <div className="wlx-history-list">
              {visibleEntries.map((entry) => <HistoryRow accounts={accounts} entry={entry} key={entry.id} />)}
              {hasMore ? <button className="wlx-history-more" onClick={() => setVisibleCount((current) => current + ACCOUNT_HISTORY_PAGE_SIZE)} type="button">Mostrar mais</button> : null}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
