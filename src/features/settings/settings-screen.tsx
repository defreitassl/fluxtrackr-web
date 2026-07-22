"use client";

import {
  Bell,
  ChevronRight,
  Info,
  Laptop,
  Lock,
  MoonStar,
  Palette,
  Send,
  SunMedium,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { useNotificationPreferences } from "@/features/notifications/queries/use-notification-feeds";
import { SettingsDrawer } from "@/features/settings/components/settings-drawer";
import { useChangePassword, useMe, useUpdateMe } from "@/features/settings/queries/use-me";
import { currentMonthValue, toListParams } from "@/features/transactions/lib/transactions-filters";
import { useTransactions } from "@/features/transactions/queries/use-transactions";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/http";
import { type Theme, useTheme } from "@/providers/theme-provider";

const memberSinceFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

const themeLabels: Record<Theme, string> = {
  system: "Automático",
  light: "Claro",
  dark: "Escuro",
};

const themeOptions: Array<{ value: Theme; label: string; description: string; icon: typeof Laptop }> = [
  { value: "system", label: "Automático", description: "Segue a preferência do dispositivo", icon: Laptop },
  { value: "light", label: "Claro", description: "Mantém a interface sempre clara", icon: SunMedium },
  { value: "dark", label: "Escuro", description: "Mantém a interface sempre escura", icon: MoonStar },
];

function initialsOf(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

type DrawerKind = "quick-edit" | "personal" | "security" | "theme" | null;

type Toast = { title: string; text: string } | null;

type SettingsScreenProps = {
  email: string;
};

export function SettingsScreen({ email }: SettingsScreenProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const me = useMe();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();
  const preferences = useNotificationPreferences();
  const monthTransactions = useTransactions(
    toListParams({
      month: currentMonthValue(),
      type: "",
      accountId: "",
      categoryId: "",
      paymentMethod: "",
      source: "",
    }),
  );

  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [name, setName] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = me.data?.name ?? email.split("@")[0];
  const displayEmail = me.data?.email ?? email;
  const telegramCount = useMemo(
    () => (monthTransactions.data ?? []).filter((transaction) => transaction.source === "telegram").length,
    [monthTransactions.data],
  );
  const enabledPreferences = preferences.data
    ? preferences.data.preferences.filter((preference) => preference.enabled).length
    : null;

  function showToast(title: string, text: string) {
    setToast({ title, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function openDrawer(kind: Exclude<DrawerKind, null>) {
    setFormError(null);
    setName(me.data?.name ?? "");
    setPasswords({ current: "", next: "", confirm: "" });
    setDrawer(kind);
  }

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Informe um nome.");
      return;
    }
    updateMe.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setDrawer(null);
          showToast("Perfil atualizado", "As informações da conta foram salvas.");
        },
        onError: () => setFormError("Não foi possível salvar. Tente novamente."),
      },
    );
  }

  function savePassword() {
    if (!passwords.current) {
      setFormError("Informe a senha atual.");
      return;
    }
    if (passwords.next.length < 8) {
      setFormError("A nova senha precisa de pelo menos 8 caracteres.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setFormError("As novas senhas precisam ser iguais.");
      return;
    }
    changePassword.mutate(
      { currentPassword: passwords.current, newPassword: passwords.next },
      {
        onSuccess: () => {
          setDrawer(null);
          showToast("Senha atualizada", "A nova senha já está ativa.");
        },
        onError: (error) =>
          setFormError(
            error instanceof ApiError && error.status === 400
              ? "A senha atual está incorreta."
              : "Não foi possível atualizar a senha. Tente novamente.",
          ),
      },
    );
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/login?state=logout");
    router.refresh();
  }

  const isSaving = updateMe.isPending || changePassword.isPending;

  return (
    <section className="pfx-screen" aria-label="Perfil e configurações">
      <div className="pfx-column">
        <div className="pfx-section-label">
          <strong>Conta e segurança</strong>
          <span>Dados e acesso</span>
        </div>

        <div className="pfx-profile-card">
          <span className="pfx-avatar" aria-hidden="true">
            {initialsOf(displayName)}
          </span>
          <div className="pfx-profile-copy">
            <strong>{displayName}</strong>
            <span>{displayEmail}</span>
          </div>
          <button className="pfx-edit-link" onClick={() => openDrawer("quick-edit")} type="button">
            Editar
          </button>
        </div>

        <div className="pfx-group">
          <button className="pfx-row" onClick={() => openDrawer("personal")} type="button">
            <span className="pfx-row-icon">
              <UserRound aria-hidden="true" size={18} />
            </span>
            <span className="pfx-row-copy">
              <strong>Dados pessoais</strong>
              <span>Informações completas da conta</span>
            </span>
            <span className="pfx-row-end">
              <ChevronRight aria-hidden="true" size={15} />
            </span>
          </button>
          <button className="pfx-row" onClick={() => openDrawer("security")} type="button">
            <span className="pfx-row-icon pfx-row-icon-amber">
              <Lock aria-hidden="true" size={17} />
            </span>
            <span className="pfx-row-copy">
              <strong>Segurança</strong>
              <span>Senha de acesso à conta</span>
            </span>
            <span className="pfx-row-end">
              <ChevronRight aria-hidden="true" size={15} />
            </span>
          </button>
        </div>

        <div className="pfx-section-label">
          <strong>Preferências</strong>
          <span>Experiência do aplicativo</span>
        </div>
        <div className="pfx-group">
          <button className="pfx-row" onClick={() => openDrawer("theme")} type="button">
            <span className="pfx-row-icon">
              <Palette aria-hidden="true" size={17} />
            </span>
            <span className="pfx-row-copy">
              <strong>Aparência</strong>
              <span>Tema automático, claro ou escuro</span>
            </span>
            <span className="pfx-row-end">
              {themeLabels[theme]}
              <ChevronRight aria-hidden="true" size={15} />
            </span>
          </button>
          <Link className="pfx-row" href="/notifications">
            <span className="pfx-row-icon pfx-row-icon-blue">
              <Bell aria-hidden="true" size={17} />
            </span>
            <span className="pfx-row-copy">
              <strong>Notificações</strong>
              <span>Alertas financeiros e lembretes</span>
            </span>
            <span className="pfx-row-end">
              {enabledPreferences === null ? "—" : `${enabledPreferences} de 5 ativas`}
              <ChevronRight aria-hidden="true" size={15} />
            </span>
          </Link>
        </div>
      </div>

      <div className="pfx-column">
        <div className="pfx-section-label">
          <strong>Integrações</strong>
          <span>Serviços opcionais</span>
        </div>
        <div className="pfx-status-card">
          <div className="pfx-status-head">
            <div className="pfx-status-main">
              <span className="pfx-status-icon">
                <Send aria-hidden="true" size={17} />
              </span>
              <div className="pfx-status-copy">
                <strong>Bot do Telegram</strong>
                <span>Registro rápido de movimentações</span>
              </div>
            </div>
            <span className={cn("pfx-badge", telegramCount === 0 && "pfx-badge-muted")}>
              {telegramCount > 0 ? "Em uso" : "Disponível"}
            </span>
          </div>
          <div className="pfx-status-meta">
            <div>
              <span>Acesso</span>
              <strong>Privado</strong>
            </div>
            <div>
              <span>Lançamentos via bot no mês</span>
              <strong>{monthTransactions.data ? telegramCount : "—"}</strong>
            </div>
          </div>
        </div>

        <div className="pfx-section-label">
          <strong>Aplicativo</strong>
          <span>Informações gerais</span>
        </div>
        <div className="pfx-group">
          <div className="pfx-row" style={{ cursor: "default" }}>
            <span className="pfx-row-icon">
              <Info aria-hidden="true" size={17} />
            </span>
            <span className="pfx-row-copy">
              <strong>Sobre o FluxTrackr</strong>
              <span>Gestão financeira pessoal · web</span>
            </span>
            <span className="pfx-row-end">v0.1.0</span>
          </div>
        </div>

        <button className="pfx-logout" onClick={() => setConfirmingLogout(true)} type="button">
          Sair da conta
        </button>
      </div>

      {/* Edição rápida */}
      <SettingsDrawer
        footer={
          <>
            <button className="txx-drawer-cancel" disabled={isSaving} onClick={() => setDrawer(null)} type="button">
              Cancelar
            </button>
            <button className="txx-drawer-save" disabled={isSaving} onClick={saveName} type="button">
              {updateMe.isPending ? "Salvando…" : "Salvar alterações"}
            </button>
          </>
        }
        onClose={() => setDrawer(null)}
        open={drawer === "quick-edit"}
        subtitle="Atualize os dados apresentados no resumo do perfil"
        title="Editar informações básicas"
      >
        <label className="txx-field">
          <span>Nome de exibição</span>
          <input
            className="txx-input"
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
            value={name}
          />
        </label>
        <label className="txx-field">
          <span>E-mail principal</span>
          <input className="txx-input" disabled readOnly value={displayEmail} />
          <span className="pfx-field-note" style={{ marginTop: 6, display: "block" }}>
            O e-mail é o identificador de acesso da conta e não pode ser alterado por aqui.
          </span>
        </label>
        {formError ? (
          <p className="txx-form-error" role="alert">
            {formError}
          </p>
        ) : null}
      </SettingsDrawer>

      {/* Dados pessoais */}
      <SettingsDrawer
        footer={
          <>
            <button className="txx-drawer-cancel" disabled={isSaving} onClick={() => setDrawer(null)} type="button">
              Cancelar
            </button>
            <button className="txx-drawer-save" disabled={isSaving} onClick={saveName} type="button">
              {updateMe.isPending ? "Salvando…" : "Salvar dados pessoais"}
            </button>
          </>
        }
        onClose={() => setDrawer(null)}
        open={drawer === "personal"}
        subtitle="Conta e segurança"
        title="Dados pessoais"
      >
        <div className="pfx-detail-hero">
          <small>Conta e segurança</small>
          <strong>Dados pessoais</strong>
          <span>Gerencie as informações associadas à sua conta FluxTrackr.</span>
        </div>
        <div className="pfx-form-card">
          <h4>Informações principais</h4>
          <label className="txx-field">
            <span>Nome completo</span>
            <input
              className="txx-input"
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              value={name}
            />
          </label>
          <label className="txx-field" style={{ marginBottom: 0 }}>
            <span>E-mail</span>
            <input className="txx-input" disabled readOnly value={displayEmail} />
          </label>
        </div>
        <div className="pfx-form-card">
          <h4>Conta</h4>
          <div className="pfx-two-cols">
            <label className="txx-field" style={{ marginBottom: 0 }}>
              <span>Membro desde</span>
              <input
                className="txx-input"
                disabled
                readOnly
                value={me.data ? memberSinceFormatter.format(new Date(me.data.createdAt)) : "—"}
              />
            </label>
            <label className="txx-field" style={{ marginBottom: 0 }}>
              <span>Tipo</span>
              <input className="txx-input" disabled readOnly value="Conta pessoal" />
            </label>
          </div>
        </div>
        <div className="pfx-form-card">
          <h4>Preferências regionais</h4>
          <div className="pfx-two-cols">
            <label className="txx-field" style={{ marginBottom: 0 }}>
              <span>Idioma</span>
              <input className="txx-input" disabled readOnly value="Português (Brasil)" />
            </label>
            <label className="txx-field" style={{ marginBottom: 0 }}>
              <span>Moeda</span>
              <input className="txx-input" disabled readOnly value="Real brasileiro (BRL)" />
            </label>
          </div>
        </div>
        {formError ? (
          <p className="txx-form-error" role="alert">
            {formError}
          </p>
        ) : null}
      </SettingsDrawer>

      {/* Segurança */}
      <SettingsDrawer
        footer={
          <>
            <button className="txx-drawer-cancel" disabled={isSaving} onClick={() => setDrawer(null)} type="button">
              Cancelar
            </button>
            <button className="txx-drawer-save" disabled={isSaving} onClick={savePassword} type="button">
              {changePassword.isPending ? "Atualizando…" : "Atualizar senha"}
            </button>
          </>
        }
        onClose={() => setDrawer(null)}
        open={drawer === "security"}
        subtitle="Conta e segurança"
        title="Segurança"
      >
        <div className="pfx-detail-hero">
          <small>Conta e segurança</small>
          <strong>Segurança</strong>
          <span>Atualize sua senha de acesso. A troca vale para todos os dispositivos.</span>
        </div>
        <div className="pfx-form-card">
          <h4>Alterar senha</h4>
          <label className="txx-field">
            <span>Senha atual</span>
            <input
              autoComplete="current-password"
              className="txx-input"
              onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
              type="password"
              value={passwords.current}
            />
          </label>
          <label className="txx-field">
            <span>Nova senha</span>
            <input
              autoComplete="new-password"
              className="txx-input"
              onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
              type="password"
              value={passwords.next}
            />
          </label>
          <label className="txx-field" style={{ marginBottom: 0 }}>
            <span>Confirmar nova senha</span>
            <input
              autoComplete="new-password"
              className="txx-input"
              onChange={(event) =>
                setPasswords((current) => ({ ...current, confirm: event.target.value }))
              }
              type="password"
              value={passwords.confirm}
            />
          </label>
        </div>
        <div className="pfx-form-card">
          <h4>Sessão</h4>
          <div className="pfx-session">
            <div>
              <strong>Este navegador</strong>
              <span>Sessão atual · expira automaticamente em 24 horas</span>
            </div>
            <span className="pfx-badge">Atual</span>
          </div>
        </div>
        {formError ? (
          <p className="txx-form-error" role="alert">
            {formError}
          </p>
        ) : null}
      </SettingsDrawer>

      {/* Aparência */}
      <SettingsDrawer
        onClose={() => setDrawer(null)}
        open={drawer === "theme"}
        subtitle="Escolha como o FluxTrackr define o tema"
        title="Aparência"
      >
        <div className="wlx-account-options">
          {themeOptions.map((option) => (
            <button
              aria-pressed={theme === option.value}
              className="wlx-account-option"
              key={option.value}
              onClick={() => {
                setTheme(option.value);
                setDrawer(null);
                showToast("Aparência atualizada", `Tema ${option.label.toLowerCase()} selecionado.`);
              }}
              type="button"
            >
              <span className="wlx-avatar">
                <option.icon aria-hidden="true" size={16} />
              </span>
              <span className="wlx-account-option-info">
                <strong>{option.label}</strong>
                <span style={{ fontFamily: "inherit" }}>{option.description}</span>
              </span>
              <span className="wlx-radio" aria-hidden="true" />
            </button>
          ))}
        </div>
      </SettingsDrawer>

      {/* Confirmação de logout */}
      <Dialog
        description="Você precisará informar suas credenciais novamente para acessar o FluxTrackr."
        descriptionId="logout-description"
        onClose={() => setConfirmingLogout(false)}
        open={confirmingLogout}
        title="Sair da conta?"
        titleId="logout-title"
      >
        <div className="txx-drawer-foot" style={{ padding: "16px 0 0", borderTop: 0 }}>
          <button className="txx-drawer-cancel" onClick={() => setConfirmingLogout(false)} type="button">
            Cancelar
          </button>
          <button
            className="txx-drawer-save"
            onClick={logout}
            style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
            type="button"
          >
            Sair da conta
          </button>
        </div>
      </Dialog>

      <div aria-live="polite" className={cn("nfx-toast", toast && "nfx-toast-show")}>
        {toast ? (
          <>
            <strong>{toast.title}</strong>
            <span>{toast.text}</span>
          </>
        ) : null}
      </div>
    </section>
  );
}
