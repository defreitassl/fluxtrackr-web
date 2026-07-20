import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-server", () => ({
  API_REQUEST_TIMEOUT_MS: 10_000,
  getApiUrl: (path: string) => new URL(path, "http://api.internal/"),
}));

import { POST } from "@/app/api/auth/login/route";

const credentials = { email: "user@fluxtrackr.test", password: "local-password" };

function createRequest() {
  return new Request("http://web.test/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/auth/login", () => {
  it.each([
    [new Error("connection refused")],
    [Object.assign(new Error("request aborted"), { name: "AbortError" })],
  ])("returns a generic 503 when the upstream is unavailable", async (error) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));

    const response = await POST(createRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "Serviço indisponível. Tente novamente." });
  });

  it("keeps a real 401 as invalid credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "nope" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })));

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "E-mail ou senha incorretos." });
  });

  it("returns a gateway error when the upstream login payload is invalid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));

    const response = await POST(createRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ message: "A API retornou uma sessão inválida." });
  });
});
