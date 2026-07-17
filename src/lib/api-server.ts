import "server-only";

export function getApiBaseUrl() {
  const value = process.env.FLUXTRACKR_API_URL?.trim();

  if (!value) {
    throw new Error("FLUXTRACKR_API_URL não configurada.");
  }

  return value.replace(/\/$/, "");
}

export function getApiUrl(path: string) {
  return new URL(path, `${getApiBaseUrl()}/`);
}
