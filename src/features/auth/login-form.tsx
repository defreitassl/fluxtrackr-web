"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { type LoginFormValues, loginSchema } from "@/features/auth/login-schema";
import { safeRedirectPath } from "@/lib/safe-redirect";

type LoginResponse = {
  message?: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    register,
    handleSubmit,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(values),
    }).catch(() => null);

    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as LoginResponse | null;
      setSubmitError(body?.message ?? "Não foi possível entrar. Tente novamente.");
      return;
    }

    const next = searchParams.get("next");
    router.replace(safeRedirectPath(next));
    router.refresh();
  }

  return (
    <form className="login-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <label>
        <span>E-mail</span>
        <span className="input-wrap">
          <Mail aria-hidden="true" size={17} />
          <input
            autoComplete="email"
            disabled={isSubmitting}
            inputMode="email"
            placeholder="voce@exemplo.com"
            type="email"
            {...register("email")}
          />
        </span>
        {errors.email ? <small className="field-error">{errors.email.message}</small> : null}
      </label>

      <label>
        <span>Senha</span>
        <span className="input-wrap">
          <KeyRound aria-hidden="true" size={17} />
          <input
            autoComplete="current-password"
            disabled={isSubmitting}
            placeholder="Sua senha"
            type="password"
            {...register("password")}
          />
        </span>
        {errors.password ? <small className="field-error">{errors.password.message}</small> : null}
      </label>

      {submitError ? <p className="login-error" role="alert">{submitError}</p> : null}

      <button className="primary-button login-submit" disabled={isSubmitting} type="submit">
        <span>{isSubmitting ? "Entrando…" : "Entrar no FluxTrackr"}</span>
        <ArrowRight aria-hidden="true" size={17} />
      </button>
    </form>
  );
}
