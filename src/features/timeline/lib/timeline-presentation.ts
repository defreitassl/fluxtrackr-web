import type {
  FinancialTimelineSourceType,
  FinancialTimelineType,
  TimelineItem,
  TimelineItemBalanceImpact,
} from "@/api/generated/client";
import { formatCurrency } from "@/lib/format";

import { formatUtcDay, formatUtcTime, getUtcDayKey } from "./timeline-date-range";

const typeLabels: Record<FinancialTimelineType, string> = {
  income: "Receita",
  expense: "Despesa",
  transfer: "Transferência",
  adjustment: "Ajuste",
};

const sourceLabels: Record<FinancialTimelineSourceType, string> = {
  transaction: "Transação",
  financial_event: "Evento financeiro",
  credit_card_invoice: "Fatura",
  fixed_expense: "Gasto fixo",
  fixed_income: "Ganho fixo",
  subscription: "Assinatura",
  account_transfer: "Transferência",
  account_balance_adjustment: "Ajuste de saldo",
};

const balanceImpactLabels: Record<TimelineItemBalanceImpact, string> = {
  realized: "Realizado",
  projected: "Projetado",
  informational: "Informativo",
  none: "Sem impacto",
};

const statusLabels: Record<string, string> = {
  open: "Em aberto",
  closed: "Fechada",
  paid: "Paga",
  overdue: "Vencida",
  canceled: "Cancelado",
  planned: "Planejado",
  confirmed: "Confirmado",
  postponed: "Adiado",
  realized: "Realizado",
  pending: "Pendente",
};

export type TimelineDayGroup = {
  key: string;
  label: string;
  items: TimelineItem[];
};

export function getTimelineTypeLabel(value: FinancialTimelineType) {
  return typeLabels[value];
}

export function getTimelineSourceLabel(value: FinancialTimelineSourceType) {
  return sourceLabels[value];
}

export function getBalanceImpactLabel(value: TimelineItemBalanceImpact) {
  return balanceImpactLabels[value];
}

export function getTimelineStatusLabel(value: string) {
  return statusLabels[value] ?? formatUnknownStatus(value);
}

export function groupTimelineItemsByUtcDay(items: TimelineItem[]): TimelineDayGroup[] {
  const groups = new Map<string, TimelineDayGroup>();

  for (const item of items) {
    const key = getUtcDayKey(item.date);
    const group = groups.get(key);

    if (group) {
      group.items.push(item);
    } else {
      groups.set(key, { key, label: formatUtcDay(key), items: [item] });
    }
  }

  return [...groups.values()];
}

export function getTimelineItemDetails(item: TimelineItem) {
  return {
    amount: formatCurrency(item.amount),
    dateTime: formatUtcTime(item.date),
    type: getTimelineTypeLabel(item.type),
    source: getTimelineSourceLabel(item.sourceType),
    status: getTimelineStatusLabel(item.status),
    balanceImpact: getBalanceImpactLabel(item.balanceImpact),
  };
}

function formatUnknownStatus(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
