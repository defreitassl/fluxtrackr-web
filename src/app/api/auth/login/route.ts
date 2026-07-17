import { NextResponse } from "next/server";

import type { AccessToken, LoginRequest } from "@/api/generated/client";
import { sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth-cookie";
import { getApiUrl } from "@/lib/api-server";
import { loginSchema } from "@/features/auth/login-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informe e-mail e senha válidos." },
      { status: 400 },
    );
  }

  const credentials: LoginRequest = parsed.data;
  const upstream = await fetch(getApiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { message: "Não foi possível conectar à API do FluxTrackr." },
      { status: 503 },
    );
  }

  const payload: unknown = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const response = NextResponse.json(
      {
        message:
          upstream.status === 401
            ? "E-mail ou senha incorretos."
            : "Não foi possível entrar. Tente novamente.",
      },
      { status: upstream.status === 401 ? 401 : 502 },
    );
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const accessToken = (payload as Partial<AccessToken> | null)?.accessToken;

  if (typeof accessToken !== "string" || !accessToken) {
    return NextResponse.json(
      { message: "A API retornou uma sessão inválida." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, accessToken, sessionCookieOptions);
  return response;
}
