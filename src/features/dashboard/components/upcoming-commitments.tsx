import { CalendarDays, Landmark } from "lucide-react";

import type { DashboardOverviewUpcomingCommitmentsItem } from "@/api/generated/client";
import { formatCurrency, formatDate } from "@/lib/format";

type UpcomingCommitmentsProps = {
  commitments: DashboardOverviewUpcomingCommitmentsItem[];
};

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    planned: "Planejado",
    confirmed: "Confirmado",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

export function UpcomingCommitments({ commitments }: UpcomingCommitmentsProps) {
  return (
    <section className="dashboard-card dashboard-list-card" aria-labelledby="commitments-title">
      <div className="card-heading">
        <div>
          <p className="card-kicker">Até 30 dias</p>
          <h2 id="commitments-title">Compromissos futuros</h2>
        </div>
        <span className="card-icon" aria-hidden="true"><CalendarDays size={18} /></span>
      </div>
      {commitments.length === 0 ? (
        <div className="dashboard-inline-empty">
          <Landmark aria-hidden="true" size={18} />
          <p>Nenhum compromisso futuro para mostrar.</p>
        </div>
      ) : (
        <ul className="dashboard-list">
          {commitments.map((commitment) => (
            <li key={commitment.id}>
              <div>
                <strong>{commitment.title}</strong>
                <span>{formatDate(commitment.date)} · {formatStatus(commitment.status)}</span>
              </div>
              <b>{formatCurrency(commitment.amount)}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
