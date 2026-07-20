import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCookie } = vi.hoisted(() => ({ getCookie: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: getCookie })),
}));

vi.mock("@/lib/api-server", () => ({
  API_REQUEST_TIMEOUT_MS: 10_000,
  getApiUrl: (path: string) => new URL(path, "http://api.internal/"),
}));

import { GET } from "@/app/api/fluxtrackr/[...path]/route";

function createRequest() {
  return new NextRequest("http://web.test/api/fluxtrackr/accounts?isActive=true");
}

const context = { params: Promise.resolve({ path: ["accounts"] }) };

afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  getCookie.mockReturnValue({ value: "session-token" });
});

describe("GET /api/fluxtrackr/[...path]", () => {
  it.each([
    [new Error("connection refused")],
    [Object.assign(new Error("request aborted"), { name: "AbortError" })],
  ])("returns a generic 503 when the upstream is unavailable", async (error) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "Serviço indisponível. Tente novamente." });
  });

  it.each([400, 409, 500])("preserves upstream status and payload %i", async (status) => {
    const payload = { message: `upstream ${status}`, detail: "preserved" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    })));

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual(payload);
  });

  it("clears the local session after an upstream 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "expired" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })));

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("fluxtrackr_session=");
  });

  it("does not expose the upstream URL or stack trace after a timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(
      new Error("http://api.internal/accounts failed"),
      { name: "AbortError", stack: "internal stack" },
    )));

    const response = await GET(createRequest(), context);
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).not.toContain("api.internal");
    expect(body).not.toContain("internal stack");
  });
});
