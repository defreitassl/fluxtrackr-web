import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CircleDot,
  Equal,
  ReceiptText,
} from "lucide-react";

import type { TimelineItem } from "@/api/generated/client";
import { getTimelineItemDetails, groupTimelineItemsByUtcDay } from "@/features/timeline/lib/timeline-presentation";

type TimelineListProps = {
  hasActiveFilters: boolean;
  items: TimelineItem[];
  onClearFilters: () => void;
};

export function TimelineList({ hasActiveFilters, items, onClearFilters }: TimelineListProps) {
  if (items.length === 0) {
    return (
      <section className="timeline-empty-state" aria-labelledby="timeline-list-title">
        <span className="empty-state-icon" aria-hidden="true"><ReceiptText size={24} /></span>
        <h2 id="timeline-list-title">
          {hasActiveFilters ? "Nenhum resultado para estes filtros" : "Nenhum item neste mês"}
        </h2>
        <p>
          {hasActiveFilters
            ? "A API não retornou itens para a combinação de filtros selecionada."
            : "Ainda não há movimentações ou compromissos financeiros neste período."}
        </p>
        {hasActiveFilters ? (
          <button className="secondary-button" onClick={onClearFilters} type="button">
            Limpar filtros
          </button>
        ) : null}
      </section>
    );
  }

  const groups = groupTimelineItemsByUtcDay(items);

  return (
    <section className="timeline-list" aria-labelledby="timeline-list-title">
      <div className="timeline-section-heading">
        <div>
          <p className="page-eyebrow">Cronologia</p>
          <h2 id="timeline-list-title">Itens do período</h2>
        </div>
        <span>{items.length} {items.length === 1 ? "item" : "itens"}</span>
      </div>
      <div className="timeline-day-groups">
        {groups.map((group) => (
          <section className="timeline-day-group" aria-labelledby={`timeline-day-${group.key}`} key={group.key}>
            <h3 id={`timeline-day-${group.key}`}>{group.label}</h3>
            <ol>
              {group.items.map((item) => (
                <TimelineListItem item={item} key={item.id} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}

function TimelineListItem({ item }: { item: TimelineItem }) {
  const details = getTimelineItemDetails(item);

  return (
    <li className={`timeline-item timeline-item-${item.type}`}>
      <span className="timeline-item-icon" aria-hidden="true"><TimelineItemIcon type={item.type} /></span>
      <div className="timeline-item-content">
        <div className="timeline-item-heading">
          <strong>{item.title}</strong>
          <span className={`timeline-impact-badge timeline-impact-${item.balanceImpact}`}>
            {details.balanceImpact}
          </span>
        </div>
        <div className="timeline-item-details">
          <span>{details.dateTime}</span>
          <span>{details.type}</span>
          <span>{details.source}</span>
          <span>Status: {details.status}</span>
        </div>
      </div>
      <strong className="timeline-item-amount">{details.amount}</strong>
    </li>
  );
}

function TimelineItemIcon({ type }: Pick<TimelineItem, "type">) {
  if (type === "income") return <ArrowUpRight size={18} />;
  if (type === "expense") return <ArrowDownLeft size={18} />;
  if (type === "transfer") return <ArrowLeftRight size={18} />;
  if (type === "adjustment") return <Equal size={18} />;
  return <CircleDot size={18} />;
}
