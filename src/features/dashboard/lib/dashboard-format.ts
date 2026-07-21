import { formatCurrency } from "@/lib/format";

export type AmountTone = "positive" | "negative" | "neutral";

export function formatSignedCurrency(value: string | number, tone: AmountTone) {
  const formatted = formatCurrency(Math.abs(Number(value)));
  if (tone === "negative") return `− ${formatted}`;
  if (tone === "positive") return `+ ${formatted}`;
  return formatted;
}

export function maskCurrency(value: string | number, hidden: boolean) {
  return hidden ? "R$ ••••" : formatCurrency(value);
}
