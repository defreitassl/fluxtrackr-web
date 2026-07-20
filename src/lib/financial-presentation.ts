import type { CreditCardInvoiceStatus } from "@/api/generated/client";

/**
 * Apresentações financeiras compartilhadas entre Dashboard e Carteira.
 * Centraliza o mapa de status de fatura para evitar traduções divergentes.
 */
const invoiceStatusLabels: Record<CreditCardInvoiceStatus, string> = {
  open: "Em aberto",
  closed: "Fechada",
  paid: "Paga",
  overdue: "Vencida",
  canceled: "Cancelada",
};

export function getInvoiceStatusLabel(status: CreditCardInvoiceStatus) {
  return invoiceStatusLabels[status];
}
