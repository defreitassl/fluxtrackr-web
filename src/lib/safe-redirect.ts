export const DEFAULT_REDIRECT_PATH = "/dashboard";

const INTERNAL_REDIRECT_ORIGIN = "https://fluxtrackr.local";

/**
 * Permite somente paths internos. Nunca repassa URL absoluta ou um path que o
 * navegador possa reinterpretar como host externo.
 */
export function safeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) {
    return DEFAULT_REDIRECT_PATH;
  }

  try {
    const decodedValue = decodeURIComponent(value);

    if (decodedValue.startsWith("//") || decodedValue.includes("\\")) {
      return DEFAULT_REDIRECT_PATH;
    }

    const redirectUrl = new URL(value, INTERNAL_REDIRECT_ORIGIN);

    if (redirectUrl.origin !== INTERNAL_REDIRECT_ORIGIN) {
      return DEFAULT_REDIRECT_PATH;
    }

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
}
