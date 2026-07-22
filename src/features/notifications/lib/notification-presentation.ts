import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CalendarClock,
  ChartNoAxesColumn,
  CreditCard,
  Pencil,
  Play,
  ReceiptText,
  SlidersHorizontal,
  Tag,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import type {
  Activity,
  Notification,
  NotificationCategory,
  NotificationSeverity,
} from "@/api/generated/client";

/* ── Notificações ───────────────────────────────────────────────────────── */

export type NotificationFilter =
  | "all"
  | "unread"
  | "critical"
  | NotificationCategory;

export const notificationFilterChips: Array<{ key: NotificationFilter; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "Não lidas" },
  { key: "critical", label: "Importantes" },
  { key: "invoices", label: "Faturas" },
  { key: "events", label: "Eventos" },
  { key: "subscriptions", label: "Assinaturas" },
  { key: "budgets", label: "Orçamentos" },
  { key: "goals", label: "Metas" },
];

export const severityPresentation: Record<
  NotificationSeverity,
  { label: string; pillClass: string; iconClass: string }
> = {
  critical: { label: "Alta prioridade", pillClass: "nfx-priority-high", iconClass: "nfx-icon-danger" },
  warning: { label: "Atenção", pillClass: "nfx-priority-medium", iconClass: "nfx-icon-warning" },
  info: { label: "Informativo", pillClass: "", iconClass: "nfx-icon-info" },
};

const categoryIcons: Record<NotificationCategory, LucideIcon> = {
  invoices: CreditCard,
  events: CalendarClock,
  subscriptions: Play,
  budgets: ChartNoAxesColumn,
  goals: Target,
};

export function notificationIcon(notification: Notification): LucideIcon {
  if (notification.severity === "critical") return TriangleAlert;
  return categoryIcons[notification.category] ?? TriangleAlert;
}

/** Destino ao abrir a origem da notificação. */
export function notificationHref(notification: Notification): string {
  switch (notification.sourceType) {
    case "credit_card_invoice":
      return "/wallet";
    case "category_budget":
      return "/planning";
    case "financial_goal":
      return "/planning";
    default:
      return "/timeline";
  }
}

/* ── Agrupamento por data ───────────────────────────────────────────────── */

const groupFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function dateGroupLabel(iso: string, reference = new Date()): string {
  const date = new Date(iso);
  const dayStart = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round((dayStart(reference) - dayStart(date)) / 86_400_000);
  if (diffDays <= 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return groupFormatter.format(date);
}

export function timeLabel(iso: string, reference = new Date()): string {
  const label = dateGroupLabel(iso, reference);
  if (label === "Hoje") return timeFormatter.format(new Date(iso));
  return label === "Ontem" ? "Ontem" : label;
}

export function groupByDate<T>(items: T[], getIso: (item: T) => string, reference = new Date()) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const label = dateGroupLabel(getIso(item), reference);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  return [...groups.entries()].map(([label, groupItems]) => ({ label, items: groupItems }));
}

/* ── Atividades ─────────────────────────────────────────────────────────── */

export type ActivityFilter = "all" | "transactions" | "wallet" | "planning";

export const activityFilterChips: Array<{ key: ActivityFilter; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "transactions", label: "Transações" },
  { key: "wallet", label: "Carteira" },
  { key: "planning", label: "Planejamento" },
];

const activityFilterEntities: Record<Exclude<ActivityFilter, "all">, Set<string>> = {
  transactions: new Set(["transaction"]),
  wallet: new Set(["account_transfer", "account_balance_adjustment", "credit_card_invoice"]),
  planning: new Set([
    "subscription",
    "subscription_charge",
    "category",
    "category_budget",
    "financial_event",
    "financial_goal",
    "goal_contribution",
  ]),
};

export function matchesActivityFilter(activity: Activity, filter: ActivityFilter) {
  if (filter === "all") return true;
  return activityFilterEntities[filter].has(activity.entityType);
}

export function activityIcon(activity: Activity): LucideIcon {
  if (activity.type.endsWith("_deleted") || activity.type.endsWith("_canceled")) return Trash2;
  if (activity.type.endsWith("_updated") || activity.type.endsWith("_postponed")) return Pencil;
  switch (activity.entityType) {
    case "transaction":
      return ReceiptText;
    case "account_transfer":
      return ArrowLeftRight;
    case "account_balance_adjustment":
      return SlidersHorizontal;
    case "credit_card_invoice":
      return CreditCard;
    case "subscription":
    case "subscription_charge":
      return Play;
    case "category":
      return Tag;
    case "category_budget":
      return ChartNoAxesColumn;
    default:
      return Target;
  }
}

const activitySourceLabels: Record<Exclude<ActivityFilter, "all">, string> = {
  transactions: "Transações",
  wallet: "Carteira",
  planning: "Planejamento",
};

export function activitySourceLabel(activity: Activity): string {
  for (const [filter, entities] of Object.entries(activityFilterEntities)) {
    if (entities.has(activity.entityType)) {
      return activitySourceLabels[filter as Exclude<ActivityFilter, "all">];
    }
  }
  return "Aplicativo";
}

/* ── Preferências ───────────────────────────────────────────────────────── */

export const preferenceLabels: Record<NotificationCategory, { title: string; description: string }> = {
  invoices: { title: "Faturas e cartões", description: "Vencimento, fechamento e pagamento" },
  events: { title: "Eventos financeiros", description: "Lembretes de compromissos futuros" },
  subscriptions: { title: "Assinaturas", description: "Renovações recorrentes" },
  budgets: { title: "Orçamentos", description: "Limite próximo ou ultrapassado" },
  goals: { title: "Metas", description: "Prazos e progresso das metas" },
};
