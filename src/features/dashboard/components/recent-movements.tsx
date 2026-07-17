import { ArrowLeftRight, ReceiptText, SlidersHorizontal } from "lucide-react";

import type {
  DashboardOverviewLatestMovementsItem,
  DashboardOverviewLatestMovementsItemSourceType,
} from "@/api/generated/client";
import { formatCurrency, formatDateTime } from "@/lib/format";

const movementPresentation: Record<
  DashboardOverviewLatestMovementsItemSourceType,
  { label: string; Icon: typeof ReceiptText }
> = {
  transaction: { label: "Transação", Icon: ReceiptText },
  account_transfer: { label: "Transferência", Icon: ArrowLeftRight },
  account_balance_adjustment: { label: "Ajuste de saldo", Icon: SlidersHorizontal },
};

type RecentMovementsProps = {
  movements: DashboardOverviewLatestMovementsItem[];
};

export function RecentMovements({ movements }: RecentMovementsProps) {
  return (
    <section className="dashboard-card dashboard-list-card" aria-labelledby="movements-title">
      <div className="card-heading">
        <div>
          <p className="card-kicker">Últimos registros</p>
          <h2 id="movements-title">Movimentações recentes</h2>
        </div>
      </div>
      {movements.length === 0 ? (
        <div className="dashboard-inline-empty">
          <ReceiptText aria-hidden="true" size={18} />
          <p>Nenhuma movimentação recente para mostrar.</p>
        </div>
      ) : (
        <ul className="dashboard-list movement-list">
          {movements.map((movement) => {
            const presentation = movementPresentation[movement.sourceType];
            const Icon = presentation.Icon;

            return (
              <li key={movement.id}>
                <span className={`movement-icon movement-icon-${movement.sourceType}`} aria-hidden="true">
                  <Icon size={16} />
                </span>
                <div>
                  <strong>{movement.title}</strong>
                  <span>{presentation.label} · {formatDateTime(movement.date)}</span>
                </div>
                <b>{formatCurrency(movement.amount)}</b>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
