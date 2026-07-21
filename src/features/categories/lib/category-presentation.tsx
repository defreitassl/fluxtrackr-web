import {
  Car,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  House,
  ReceiptText,
  Tags,
  TrendingUp,
  Utensils,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type { Category, CategoryType } from "@/api/generated/client";

type CategoryPresentation = {
  Icon: LucideIcon;
  color: string;
};

const colorPalette = ["#197147", "#376ea6", "#a86c16", "#a34c62", "#5e6b43", "#7457a8"];

const namedIcons: Record<string, LucideIcon> = {
  alimentacao: Utensils,
  transporte: Car,
  moradia: House,
  saude: HeartPulse,
  educacao: GraduationCap,
  lazer: Gamepad2,
  salario: WalletCards,
  investimentos: TrendingUp,
};

const fallbackIcons: Record<CategoryType, LucideIcon> = {
  income: WalletCards,
  expense: ReceiptText,
  both: Tags,
};

function normalizedCategoryName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

function stableIndex(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % colorPalette.length;
}

export function categoryPresentation(category: Pick<Category, "id" | "name" | "type">): CategoryPresentation {
  const normalizedName = normalizedCategoryName(category.name);
  return {
    Icon: namedIcons[normalizedName] ?? fallbackIcons[category.type],
    color: colorPalette[stableIndex(category.id)],
  };
}
