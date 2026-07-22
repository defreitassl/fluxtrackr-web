"use client";

import { Bell, Laptop, LogOut, MoonStar, SunMedium } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { type Theme, useTheme } from "@/providers/theme-provider";

const themeOptions: Array<{ value: Theme; label: string; icon: typeof Laptop }> = [
  { value: "system", label: "Automático", icon: Laptop },
  { value: "light", label: "Claro", icon: SunMedium },
  { value: "dark", label: "Escuro", icon: MoonStar },
];

function getDisplayName(email: string) {
  const localPart = email.split("@")[0] ?? email;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type SettingsScreenProps = {
  email: string;
};

export function SettingsScreen({ email }: SettingsScreenProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const name = getDisplayName(email);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <section className="stx-screen" aria-label="Configurações">
      <div className="stx-card">
        <div className="tlx-card-title">Aparência</div>
        <p>O tema automático segue a preferência do seu sistema.</p>
        <div className="stx-theme-options" role="group" aria-label="Tema">
          {themeOptions.map((option) => (
            <button
              aria-pressed={theme === option.value}
              className="stx-theme-option"
              key={option.value}
              onClick={() => setTheme(option.value)}
              type="button"
            >
              <option.icon aria-hidden="true" size={18} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stx-card">
        <div className="tlx-card-title">
          <Bell aria-hidden="true" size={14} />
          Notificações
        </div>
        <p>
          Escolha quais alertas você recebe — faturas, eventos, assinaturas, orçamentos e metas — na{" "}
          <Link className="dx-panel-link" href="/notifications">
            central de notificações
          </Link>
          .
        </p>
      </div>

      <div className="stx-card">
        <div className="tlx-card-title">Conta</div>
        <div className="stx-account-row">
          <span className="profile-avatar" aria-hidden="true">
            {name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </span>
          <div className="stx-account-info">
            <strong>{name}</strong>
            <span>{email} · Conta pessoal</span>
          </div>
          <button className="stx-logout" onClick={logout} type="button">
            <LogOut aria-hidden="true" size={14} />
            Sair
          </button>
        </div>
      </div>
    </section>
  );
}
