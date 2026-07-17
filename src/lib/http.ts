export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(getErrorMessage(payload, status));
    this.name = "ApiError";
  }
}

function getErrorMessage(payload: unknown, status: number) {
  if (typeof payload === "object" && payload && "message" in payload) {
    const message = payload.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(" ");
    }
  }

  return `Erro HTTP ${status}`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

function toBffUrl(url: string) {
  if (url.startsWith("/api/fluxtrackr/")) {
    return url;
  }

  return `/api/fluxtrackr${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Mutator usado exclusivamente pelo cliente Orval no navegador.
 * A API real nunca recebe JWT diretamente do JavaScript: esta URL aponta para
 * o Route Handler BFF, que lê o cookie httpOnly no servidor.
 */
export async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(toBffUrl(url), {
    ...options,
    credentials: "same-origin",
  });
  const payload = await readResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("fluxtrackr:unauthorized"));
    }

    throw new ApiError(response.status, payload);
  }

  // Orval's fetch client represents successful responses as
  // `{ data, status, headers }`. Preserve this contract while keeping errors
  // normalized as `ApiError` for React Query and UI states.
  return {
    data: payload,
    status: response.status,
    headers: response.headers,
  } as T;
}
