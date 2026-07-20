import {
  Banknote,
  ChartNoAxesCombined,
  CircleDot,
  Landmark,
  PiggyBank,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

/** Ícones conhecidos pelo frontend, mapeados para componentes lucide. */
export const accountIcons: Record<string, LucideIcon> = {
  landmark: Landmark,
  "piggy-bank": PiggyBank,
  wallet: WalletCards,
  cash: Banknote,
  investment: ChartNoAxesCombined,
  other: CircleDot,
};

export function getAccountIconComponent(icon: string | null): LucideIcon {
  return (icon && accountIcons[icon]) || CircleDot;
}
