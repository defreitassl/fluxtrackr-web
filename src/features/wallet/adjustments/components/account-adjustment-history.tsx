"use client";

import { useState } from "react";

import { useAccountBalanceAdjustments } from "@/features/wallet/adjustments/queries/use-account-balance-adjustments";
import { formatUtcDateTime } from "@/features/wallet/lib/wallet-presentation";
import { formatCurrency } from "@/lib/format";

type AccountAdjustmentHistoryProps = {
  accountId: string;
};

export function AccountAdjustmentHistory({ accountId }: AccountAdjustmentHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const history = useAccountBalanceAdjustments(accountId);

  if (history.isPending) {
    return <p className="adjustment-history-loading">Carregando histórico de ajustes…</p>;
  }

  if (history.isError) {
    return (
      <div className="adjustment-history-error" role="alert">
        <p>Não foi possível carregar o histórico de ajustes.</p>
        <button className="secondary-button" onClick={() => void history.refetch()} type="button">
          Tentar novamente
        </button>
      </div>
    );
  }

  const adjustments = history.data ?? [];
  if (adjustments.length === 0) {
    return <p className="adjustment-history-empty">Nenhum ajuste foi registrado nesta conta.</p>;
  }

  const visibleAdjustments = showAll ? adjustments : adjustments.slice(0, 5);

  return (
    <div className="adjustment-history">
      <ul aria-label="Histórico de ajustes">
        {visibleAdjustments.map((adjustment) => (
          <li key={adjustment.id}>
            <p>{formatUtcDateTime(adjustment.occurredAt)}</p>
            <dl>
              <div>
                <dt>Saldo anterior</dt>
                <dd>{formatCurrency(adjustment.previousBalance)}</dd>
              </div>
              <div>
                <dt>Novo saldo</dt>
                <dd>{formatCurrency(adjustment.newBalance)}</dd>
              </div>
              <div>
                <dt>Diferença</dt>
                <dd>{formatCurrency(adjustment.difference)}</dd>
              </div>
            </dl>
            {adjustment.reason ? <p className="adjustment-history-reason">{adjustment.reason}</p> : null}
          </li>
        ))}
      </ul>
      {adjustments.length > 5 ? (
        <button className="secondary-button" onClick={() => setShowAll((current) => !current)} type="button">
          {showAll ? "Mostrar menos" : "Mostrar todos"}
        </button>
      ) : null}
    </div>
  );
}
