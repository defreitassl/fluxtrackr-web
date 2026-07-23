import { MailOpen, Plus, type LucideIcon } from "lucide-react";

export type ContextualCta = {
  prefix: string;
  label: string;
  event: string;
  icon: LucideIcon;
};

/** Ação primária contextual compartilhada pelo cabeçalho e pela navegação móvel. */
export const contextualCtas: ContextualCta[] = [
  { prefix: "/wallet", label: "Adicionar", event: "fluxtrackr:wallet-add", icon: Plus },
  {
    prefix: "/notifications",
    label: "Marcar todas como lidas",
    event: "fluxtrackr:notifications-read-all",
    icon: MailOpen,
  },
  { prefix: "/planning", label: "Novo orçamento", event: "fluxtrackr:new-budget", icon: Plus },
  { prefix: "/categories", label: "Nova categoria", event: "fluxtrackr:new-category", icon: Plus },
  {
    prefix: "/transactions",
    label: "Nova movimentação",
    event: "fluxtrackr:new-transaction",
    icon: Plus,
  },
  { prefix: "/events", label: "Novo evento", event: "fluxtrackr:new-event", icon: Plus },
  {
    prefix: "/recurrences",
    label: "Nova recorrência",
    event: "fluxtrackr:new-recurrence",
    icon: Plus,
  },
  { prefix: "/goals", label: "Nova meta", event: "fluxtrackr:new-goal", icon: Plus },
];

export function getContextualCta(pathname: string) {
  return contextualCtas.find((entry) => pathname.startsWith(entry.prefix));
}
