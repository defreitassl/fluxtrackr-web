/**
 * Contas conhecidas neste dispositivo, para o painel "Você está entrando com".
 * Armazena apenas nome de exibição e e-mail — nunca credenciais.
 */

export type KnownAccount = {
  name: string;
  email: string;
};

const STORAGE_KEY = "fluxtrackr_known_accounts";
const MAX_ACCOUNTS = 4;

const EMPTY: KnownAccount[] = [];
let snapshot: KnownAccount[] | null = null;
const listeners = new Set<() => void>();

function persist(next: KnownAccount[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  snapshot = null;
  listeners.forEach((listener) => listener());
}

/**
 * Store externo para `useSyncExternalStore`: o snapshot do servidor é vazio,
 * então SSR e primeiro render do cliente coincidem e a conta lembrada só
 * aparece após a hidratação.
 */
export function subscribeKnownAccounts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getKnownAccountsSnapshot(): KnownAccount[] {
  snapshot ??= loadKnownAccounts();
  return snapshot;
}

export function getKnownAccountsServerSnapshot(): KnownAccount[] {
  return EMPTY;
}

export function loadKnownAccounts(): KnownAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is KnownAccount =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as KnownAccount).email === "string" &&
        typeof (entry as KnownAccount).name === "string",
    );
  } catch {
    return [];
  }
}

/** Coloca a conta no topo da lista (conta atual). */
export function rememberAccount(account: KnownAccount) {
  if (typeof window === "undefined") return;
  const others = loadKnownAccounts().filter((entry) => entry.email !== account.email);
  persist([account, ...others].slice(0, MAX_ACCOUNTS));
}

export function forgetAccount(email: string) {
  if (typeof window === "undefined") return;
  persist(loadKnownAccounts().filter((entry) => entry.email !== email));
}

export function accountInitials(account: KnownAccount) {
  const source = account.name || account.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[1][0] : "";
  return `${first}${last}`.toUpperCase();
}
