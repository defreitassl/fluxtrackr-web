import { Flag, Repeat } from "lucide-react";
import { Fragment } from "react";

import { cn } from "@/lib/cn";
import type { TimelineItemView } from "@/features/timeline/lib/timeline-item-presentation";

type TimelineEventBodyProps = {
  title: string;
  view: TimelineItemView;
  isToday?: boolean;
  balanceChip?: string | null;
};

export function TimelineEventBody({ title, view, isToday = false, balanceChip }: TimelineEventBodyProps) {
  return (
    <>
      <div className="tlx-event">
        <span className={`tlx-event-icon tlx-tone-${view.tone}`}>
          <view.Icon aria-hidden="true" size={16} />
        </span>
        <div className="tlx-event-body">
          <div className="tlx-event-title">
            <strong>{title}</strong>
            {isToday ? <span className="tlx-today-pill">Hoje</span> : null}
            {view.isInvoice ? <span className="tlx-tag tlx-tag-invoice">Vence</span> : null}
            {view.isRecurring ? (
              <span className="tlx-tag">
                <Repeat aria-hidden="true" size={11} />
                Recorrente
              </span>
            ) : null}
            {view.isProjectedEvent ? (
              <span className="tlx-tag">
                <Flag aria-hidden="true" size={11} />
                Previsto
              </span>
            ) : null}
          </div>
          <div className="tlx-event-meta">
            {view.metaParts.map((part, index) => (
              <Fragment key={part}>
                {index > 0 ? <span className="tlx-meta-dot" aria-hidden="true" /> : null}
                <span>{part}</span>
              </Fragment>
            ))}
            {view.methodLabel ? (
              <>
                <span className="tlx-meta-dot" aria-hidden="true" />
                <span className="tlx-method-pill">{view.methodLabel}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="tlx-event-value">
          <strong className={view.valueTone === "text" ? undefined : `tlx-value-${view.valueTone}`}>
            {view.value}
          </strong>
          {balanceChip ? (
            <div>
              <span className="tlx-balance-chip">
                saldo previsto <b>{balanceChip}</b>
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {view.note ? (
        <p className={cn("tlx-event-note", view.isInvoice && "tlx-event-note-invoice")}>{view.note}</p>
      ) : null}
    </>
  );
}
