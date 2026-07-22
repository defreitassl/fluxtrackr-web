import { NextResponse } from "next/server";

import type { AccessToken, RegisterRequest } from "@/api/generated/client";
import { registerSchema } from "@/features/auth/register-schema";
import { API_REQUEST_TIMEOUT_MS, getApiUrl } from "@/lib/api-server";
import { sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Verifique os dados do cadastro." },
      { status: 400 },
    );
  }

  const payload: RegisterRequest = parsed.data;
  let upstream: Response;

  try {
    upstream = await fetch(getApiUrl("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { message: "Serviço indisponível. Tente novamente." },
      { status: 503 },
    );
  }

  const upstreamPayload: unknown = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      {
        message:
          upstream.status === 409
            ? "Este e-mail já está em uso. Entre com a conta existente."
            : "Não foi possível criar a conta. Tente novamente.",
      },
      { status: upstream.status === 409 ? 409 : 502 },
    );
  }

  const accessToken = (upstreamPayload as Partial<AccessToken> | null)?.accessToken;

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
