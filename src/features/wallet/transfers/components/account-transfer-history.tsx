"use client";

import { useState } from "react";

import type { Account } from "@/api/generated/client";
import { getOppositeTransferAccount, getTransferDirection } from "@/features/wallet/transfers/lib/account-transfer-presentation";
import { useAccountTransfers } from "@/features/wallet/transfers/queries/use-account-transfers";
import { formatUtcDateTime } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type AccountTransferHistoryProps = {
  accountId: string;
  accounts: Account[];
};

export function AccountTransferHistory({ accountId, accounts }: AccountTransferHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const history = useAccountTransfers(accountId);

  if (history.isPending && !history.data) {
    return <p className="adjustment-history-loading">Carregando histórico de transferências…</p>;
  }

  if (history.isLoadingError || (history.isError && !history.data)) {
    return (
      <div className="adjustment-history-error" role="alert">
        <p>Não foi possível carregar o histórico de transferências.</p>
        <button className="secondary-button" onClick={() => void history.refetch()} type="button">Tentar novamente</button>
      </div>
    );
  }

  const transfers = history.data ?? [];
  const visibleTransfers = showAll ? transfers : transfers.slice(0, 5);

  return (
    <div className="adjustment-history">
      {history.isRefetching && !history.isRefetchError ? <p className="history-refreshing" role="status">Atualizando histórico…</p> : null}
      {history.isRefetchError ? (
        <div className="history-refetch-alert" role="alert">
          <span>Não foi possível atualizar o histórico. Os dados exibidos podem estar desatualizados.</span>
          <button className="secondary-button" onClick={() => void history.refetch()} type="button">Tentar novamente</button>
        </div>
      ) : null}
      {transfers.length === 0 ? (
        <p className="adjustment-history-empty">Nenhuma transferência foi registrada nesta conta.</p>
      ) : null}
      {transfers.length > 0 ? <ul aria-label="Histórico de transferências">
        {visibleTransfers.map((transfer) => {
          const direction = getTransferDirection(transfer, accountId);
          const oppositeAccount = getOppositeTransferAccount(transfer, accountId, accounts);
          return (
            <li key={transfer.id}>
              <p>{formatUtcDateTime(transfer.occurredAt)}</p>
              <div className="transfer-history-summary">
                <strong>{direction === "sent" ? "Enviada" : "Recebida"}</strong>
                <strong className={direction === "sent" ? "transfer-sent" : "transfer-received"}>
                  {direction === "sent" ? "− " : "+ "}{formatCurrency(transfer.amount)}
                </strong>
              </div>
              <p className="transfer-history-counterpart">{oppositeAccount?.name ?? "Conta arquivada ou indisponível"}</p>
              {transfer.description ? <p className="adjustment-history-reason">{transfer.description}</p> : null}
            </li>
          );
        })}
      </ul> : null}
      {transfers.length > 5 ? (
        <button className="secondary-button" onClick={() => setShowAll((current) => !current)} type="button">
          {showAll ? "Mostrar menos" : "Mostrar todas"}
        </button>
      ) : null}
    </div>
  );
}
