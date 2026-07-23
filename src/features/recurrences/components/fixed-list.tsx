import { Archive, CalendarDays, Pencil, Power } from "lucide-react";

import type { Account, Category, FixedExpense, FixedIncome } from "@/api/generated/client";
import {
  fixedDayLabel,
  fixedKindLabel,
  resolveRecurrenceCategory,
} from "@/features/recurrences/lib/recurrence-presentation";
import type { FixedKind, FixedTemplate } from "@/features/recurrences/schemas/fixed-form-schema";
import { formatCurrency } from "@/lib/format";

type FixedListProps = {
  accounts: Account[];
  categories: Category[];
  items: Array<FixedExpense | FixedIncome>;
  kind: FixedKind;
  onArchive: (kind: FixedKind, item: FixedTemplate) => void;
  onEdit: (kind: FixedKind, item: FixedTemplate) => void;
  onToggle: (kind: FixedKind, item: FixedTemplate) => void;
};

function itemDay(item: FixedTemplate, kind: FixedKind) {
  return kind === "expense" ? (item as FixedExpense).dueDay : (item as FixedIncome).receiveDay;
}

export function FixedList({ accounts, categories, items, kind, onArchive, onEdit, onToggle }: FixedListProps) {
  return (
    <div className="rcx-card-list">
      {items.map((item) => (
        <article className="rcx-card" key={item.id}>
          <div className="rcx-card-head">
            <span className="rcx-card-icon"><CalendarDays aria-hidden="true" size={17} /></span>
            <div>
              <strong>{item.name}</strong>
              <span>{fixedKindLabel(kind)}</span>
            </div>
            <span className="rcx-status-pill">{item.isActive ? "Ativo" : "Pausado"}</span>
          </div>
          <p className="rcx-card-amount">{formatCurrency(item.amount)}</p>
          <dl className="rcx-card-details">
            <div><dt>Agenda</dt><dd>{fixedDayLabel(kind, itemDay(item, kind))}</dd></div>
            <div><dt>Conta</dt><dd>{item.accountId ? accounts.find((account) => account.id === item.accountId)?.name ?? "Conta indisponível" : "Não definida"}</dd></div>
            <div><dt>Categoria</dt><dd>{resolveRecurrenceCategory(item.categoryId, categories)}</dd></div>
            <div><dt>Pagamento</dt><dd>{item.paymentMethod ?? "Não definido"}</dd></div>
          </dl>
          <div className="rcx-card-actions">
            <button aria-pressed={item.isActive} onClick={() => onToggle(kind, item)} type="button">
              <Power aria-hidden="true" size={14} /> {item.isActive ? "Pausar" : "Ativar"}
            </button>
            <button onClick={() => onEdit(kind, item)} type="button"><Pencil aria-hidden="true" size={14} /> Editar</button>
            <button className="rcx-danger-action" onClick={() => onArchive(kind, item)} type="button"><Archive aria-hidden="true" size={14} /> Arquivar</button>
          </div>
        </article>
      ))}
    </div>
  );
}
