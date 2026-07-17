"use client";

import { Laptop, MoonStar, SunMedium } from "lucide-react";

import { type Theme, useTheme } from "@/providers/theme-provider";

const nextTheme: Record<Theme, Theme> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const labels: Record<Theme, string> = {
  system: "Tema do sistema",
  light: "Tema claro",
  dark: "Tema escuro",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "system" ? Laptop : theme === "light" ? SunMedium : MoonStar;

  return (
    <button
      aria-label={`${labels[theme]}. Alterar tema.`}
      className="icon-button"
      onClick={() => setTheme(nextTheme[theme])}
      title={labels[theme]}
      type="button"
    >
      <Icon aria-hidden="true" size={17} />
    </button>
  );
}
