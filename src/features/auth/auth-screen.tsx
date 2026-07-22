"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Eye, EyeOff, LogOut, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { loginSchema, type LoginFormValues } from "@/features/auth/login-schema";
import {
  accountInitials,
  forgetAccount,
  getKnownAccountsServerSnapshot,
  getKnownAccountsSnapshot,
  rememberAccount,
  subscribeKnownAccounts,
  type KnownAccount,
} from "@/features/auth/known-accounts";
import { registerSchema, type RegisterFormValues } from "@/features/auth/register-schema";
import { cn } from "@/lib/cn";
import { safeRedirectPath } from "@/lib/safe-redirect";

type View = "login" | "switch" | "register" | "validating";

type Banner = { tone: "error" | "info"; text: string } | null;

async function readMessage(response: Response | null) {
  const body = (await response?.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? null;
}

/** Busca o nome real após autenticar, para o painel de conta lembrada. */
async function fetchDisplayName(fallback: string) {
  try {
    const response = await fetch("/api/fluxtrackr/me", { credentials: "same-origin" });
    if (!response.ok) return fallback;
    const me = (await response.json()) as { name?: string };
    return me.name?.trim() || fallback;
  } catch {
    return fallback;
  }
}

function PasswordInput({
  error,
  autoComplete,
  registration,
  disabled,
}: {
  error?: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn("agx-field", error && "agx-field-error")}>
      <label htmlFor={registration.name}>{autoComplete === "new-password" ? "Crie uma senha" : "Senha"}</label>
      <div className="agx-input-shell">
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          id={registration.name}
          placeholder="••••••••"
          type={visible ? "text" : "password"}
          {...registration}
        />
        <button
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="agx-eye"
          onClick={() => setVisible((value) => !value)}
          tabIndex={-1}
          type="button"
        >
          {visible ? <EyeOff aria-hidden="true" size={15} /> : <Eye aria-hidden="true" size={15} />}
        </button>
      </div>
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionState = searchParams.get("state");

  // Contas lembradas vêm do store do localStorage; o snapshot do servidor é
  // vazio, então SSR e primeiro render coincidem (sem hydration mismatch).
  const knownAccounts = useSyncExternalStore(
    subscribeKnownAccounts,
    getKnownAccountsSnapshot,
    getKnownAccountsServerSnapshot,
  );

  // undefined = padrão (conta mais recente); null = formulário completo.
  const [accountChoice, setAccountChoice] = useState<string | null | undefined>(undefined);
  const selectedAccount =
    accountChoice === null
      ? null
      : (knownAccounts.find((account) => account.email === accountChoice) ??
        knownAccounts[0] ??
        null);

  const [view, setView] = useState<View>("login");
  const [dismissedState, setDismissedState] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const isSubmitting = loginForm.formState.isSubmitting || registerForm.formState.isSubmitting;

  function finishLogin() {
    setView("validating");
    const next = safeRedirectPath(searchParams.get("next"));
    setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 900);
  }

  async function submitLogin(values: { email: string; password: string }) {
    setBanner(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(values),
    }).catch(() => null);

    if (!response?.ok) {
      setBanner({
        tone: "error",
        text: (await readMessage(response)) ?? "Não foi possível entrar. Tente novamente.",
      });
      return;
    }

    const fallback = selectedAccount?.email === values.email ? selectedAccount.name : values.email.split("@")[0];
    rememberAccount({ email: values.email, name: await fetchDisplayName(fallback) });
    finishLogin();
  }

  async function onLoginSubmit(values: LoginFormValues) {
    await submitLogin(values);
  }

  /** Login com conta lembrada: o e-mail vem do painel, só a senha é digitada. */
  async function onRememberedSubmit(values: LoginFormValues) {
    if (!selectedAccount) return;
    await submitLogin({ email: selectedAccount.email, password: values.password });
  }

  function chooseAccount(account: KnownAccount | null) {
    setAccountChoice(account?.email ?? null);
    loginForm.setValue("email", account?.email ?? "");
    loginForm.setValue("password", "");
    setBanner(null);
  }

  async function onRegisterSubmit(values: RegisterFormValues) {
    setBanner(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(values),
    }).catch(() => null);

    if (!response?.ok) {
      setBanner({
        tone: "error",
        text: (await readMessage(response)) ?? "Não foi possível criar a conta. Tente novamente.",
      });
      return;
    }

    rememberAccount({ email: values.email, name: values.name });
    finishLogin();
  }

  /* ── Estados de sessão (logout / expirada) ── */
  if (!dismissedState && sessionState === "logout") {
    return (
      <div className="agx-state">
        <span className="agx-state-icon">
          <LogOut aria-hidden="true" size={30} />
        </span>
        <h2>Você saiu da conta</h2>
        <p>A sessão foi encerrada com segurança e os dados protegidos foram ocultados.</p>
        <button className="agx-primary" onClick={() => setDismissedState(true)} type="button">
          Voltar para o login
        </button>
      </div>
    );
  }

  if (!dismissedState && sessionState === "expired") {
    return (
      <div className="agx-state">
        <span className="agx-state-icon agx-state-icon-warning">
          <TriangleAlert aria-hidden="true" size={30} />
        </span>
        <h2>Sessão expirada</h2>
        <p>Por segurança, sua sessão terminou. Entre novamente para continuar.</p>
        <button className="agx-primary" onClick={() => setDismissedState(true)} type="button">
          Entrar novamente
        </button>
      </div>
    );
  }

  if (view === "validating") {
    return (
      <div className="agx-state" aria-live="polite">
        <span className="agx-state-icon">
          <Check aria-hidden="true" size={30} />
        </span>
        <h2>Validando sua sessão</h2>
        <p>Estamos verificando suas credenciais e preparando seus dados financeiros.</p>
        <div className="agx-progress">
          <i />
        </div>
      </div>
    );
  }

  /* ── Trocar conta ── */
  if (view === "switch") {
    return (
      <div>
        <div className="agx-card-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              aria-label="Voltar para o login"
              className="agx-back"
              onClick={() => setView("login")}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </button>
            <div>
              <h2>Trocar conta</h2>
              <p>Escolha uma conta usada neste dispositivo ou crie uma nova.</p>
            </div>
          </div>
        </div>

        <div className="agx-accounts-list">
          {knownAccounts.map((account) => {
            const isCurrent = account.email === selectedAccount?.email;
            return (
              <button
                aria-pressed={isCurrent}
                className="agx-account-option"
                key={account.email}
                onClick={() => {
                  chooseAccount(account);
                  setView("login");
                }}
                type="button"
              >
                <span className="agx-account-avatar">{accountInitials(account)}</span>
                <span>
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                </span>
                <span className={cn("agx-pill", isCurrent && "agx-pill-active")}>
                  {isCurrent ? "Atual" : "Usar"}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <button
            className="agx-secondary"
            onClick={() => {
              chooseAccount(null);
              setView("login");
            }}
            type="button"
          >
            Entrar com outra conta
          </button>
          <button
            className="agx-primary"
            onClick={() => {
              setBanner(null);
              setView("register");
            }}
            type="button"
          >
            Criar nova conta
          </button>
        </div>
      </div>
    );
  }

  /* ── Cadastro ── */
  if (view === "register") {
    return (
      <div>
        <div className="agx-card-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              aria-label="Voltar para o login"
              className="agx-back"
              onClick={() => setView("login")}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </button>
            <div>
              <h2>Criar sua conta</h2>
              <p>Leva menos de um minuto — só nome, e-mail e senha.</p>
            </div>
          </div>
        </div>

        <form className="agx-form" noValidate onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
          <div className={cn("agx-field", registerForm.formState.errors.name && "agx-field-error")}>
            <label htmlFor="name">Nome</label>
            <div className="agx-input-shell">
              <input
                autoComplete="name"
                disabled={isSubmitting}
                id="name"
                placeholder="Como devemos te chamar"
                type="text"
                {...registerForm.register("name")}
              />
            </div>
            {registerForm.formState.errors.name ? (
              <small className="field-error">{registerForm.formState.errors.name.message}</small>
            ) : null}
          </div>

          <div className={cn("agx-field", registerForm.formState.errors.email && "agx-field-error")}>
            <label htmlFor="register-email">E-mail</label>
            <div className="agx-input-shell">
              <input
                autoComplete="email"
                disabled={isSubmitting}
                id="register-email"
                inputMode="email"
                placeholder="voce@exemplo.com"
                type="email"
                {...registerForm.register("email")}
              />
            </div>
            {registerForm.formState.errors.email ? (
              <small className="field-error">{registerForm.formState.errors.email.message}</small>
            ) : null}
          </div>

          <PasswordInput
            autoComplete="new-password"
            disabled={isSubmitting}
            error={registerForm.formState.errors.password?.message}
            registration={registerForm.register("password")}
          />

          {banner ? (
            <p className={cn("agx-banner", banner.tone === "info" && "agx-banner-info")} role="alert">
              {banner.text}
            </p>
          ) : null}

          <button className="agx-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? <span className="agx-spinner" aria-label="Criando conta" /> : "Criar conta e entrar"}
          </button>
        </form>

        <div className="agx-security">
          <i aria-hidden="true" />
          <span>Sua senha é armazenada com criptografia e nunca fica visível para nós.</span>
        </div>
      </div>
    );
  }

  /* ── Login ── */
  const remembered = selectedAccount !== null;

  return (
    <div>
      <div className="agx-card-head">
        <div>
          <h2>{remembered ? "Digite sua senha" : "Bem-vindo de volta"}</h2>
          <p>
            {remembered
              ? "Para continuar, confirme a senha desta conta."
              : "Entre com suas credenciais para continuar."}
          </p>
        </div>
        <button
          className="agx-help"
          onClick={() =>
            setBanner({
              tone: "info",
              text: remembered
                ? "Use “Trocar” para acessar outra conta ou criar uma nova."
                : "Novo por aqui? Crie sua conta gratuitamente pelo botão abaixo.",
            })
          }
          type="button"
        >
          Ajuda
        </button>
      </div>

      {remembered ? (
        <section className="agx-account-panel">
          <small>Você está entrando com</small>
          <div className="agx-account-box">
            <span className="agx-account-avatar">{accountInitials(selectedAccount)}</span>
            <div>
              <strong>{selectedAccount.name}</strong>
              <span>{selectedAccount.email}</span>
            </div>
            <button className="agx-swap" onClick={() => setView("switch")} type="button">
              Trocar
            </button>
          </div>
        </section>
      ) : null}

      <form
        className="agx-form"
        noValidate
        onSubmit={(event) => {
          // Em modo lembrado o campo de e-mail não é renderizado; injeta o
          // e-mail da conta antes da validação do schema.
          if (selectedAccount) {
            loginForm.setValue("email", selectedAccount.email);
          }
          void loginForm.handleSubmit(remembered ? onRememberedSubmit : onLoginSubmit)(event);
        }}
      >
        {!remembered ? (
          <div className={cn("agx-field", loginForm.formState.errors.email && "agx-field-error")}>
            <label htmlFor="email">E-mail</label>
            <div className="agx-input-shell">
              <input
                autoComplete="email"
                disabled={isSubmitting}
                id="email"
                inputMode="email"
                placeholder="voce@exemplo.com"
                type="email"
                {...loginForm.register("email")}
              />
            </div>
            {loginForm.formState.errors.email ? (
              <small className="field-error">{loginForm.formState.errors.email.message}</small>
            ) : null}
          </div>
        ) : null}

        <PasswordInput
          autoComplete="current-password"
          disabled={isSubmitting}
          error={loginForm.formState.errors.password?.message}
          registration={loginForm.register("password")}
        />

        {banner ? (
          <p className={cn("agx-banner", banner.tone === "info" && "agx-banner-info")} role="alert">
            {banner.text}
          </p>
        ) : null}

        <div style={{ display: "grid", gap: 10, marginTop: 2 }}>
          <button className="agx-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? <span className="agx-spinner" aria-label="Entrando" /> : "Entrar"}
          </button>
          {remembered ? (
            <button
              className="agx-secondary"
              disabled={isSubmitting}
              onClick={() => {
                forgetAccount(selectedAccount.email);
                setAccountChoice(undefined);
                loginForm.setValue("email", "");
                loginForm.setValue("password", "");
                setBanner(null);
              }}
              type="button"
            >
              Não é você? Esquecer esta conta
            </button>
          ) : (
            <button
              className="agx-secondary"
              disabled={isSubmitting}
              onClick={() => {
                setBanner(null);
                setView("register");
              }}
              type="button"
            >
              Criar nova conta
            </button>
          )}
        </div>
      </form>

      <div className="agx-security">
        <i aria-hidden="true" />
        <span>Esta conta permanece protegida e vinculada aos seus dados financeiros.</span>
      </div>
      {remembered ? (
        <button
          className="agx-text-button"
          onClick={() => {
            setBanner(null);
            setView("register");
          }}
          style={{ width: "100%", marginTop: 4 }}
          type="button"
        >
          Criar nova conta
        </button>
      ) : null}
    </div>
  );
}
