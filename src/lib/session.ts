import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth-cookie";

export type SessionIdentity = Readonly<{
  email: string;
}>;

type JwtPayload = {
  email?: unknown;
  exp?: unknown;
};

function decodePayload(token: string): JwtPayload | null {
  const payload = token.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Leitura otimista apenas para navegação e identificação visual. A API continua
 * sendo única autoridade para validar assinatura e autorização do JWT.
 */
export async function getSessionIdentity(): Promise<SessionIdentity | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = decodePayload(token);

  if (!payload || typeof payload.email !== "string") {
    return null;
  }

  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return null;
  }

  return { email: payload.email };
}
