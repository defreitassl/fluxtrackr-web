import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth-cookie";
import { getApiUrl } from "@/lib/api-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ path: string[] }>;
};

async function forward(request: NextRequest, context: Context) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "Sessão ausente." }, { status: 401 });
  }

  const { path } = await context.params;
  const upstreamUrl = getApiUrl(`/${path.map(encodeURIComponent).join("/")}`);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(upstreamUrl, init).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { message: "API indisponível." },
      { status: 503 },
    );
  }

  const contentTypeResponse = upstream.headers.get("content-type");
  const response = new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: {
      ...(contentTypeResponse ? { "Content-Type": contentTypeResponse } : {}),
      "Cache-Control": "no-store",
    },
  });

  if (upstream.status === 401) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }

  return response;
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
