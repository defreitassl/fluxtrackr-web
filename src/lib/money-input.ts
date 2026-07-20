const DECIMAL_INPUT_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

/**
 * Aceita um decimal simples com vírgula ou ponto e devolve a forma canônica
 * usada nos contratos da API. Entradas inválidas retornam string vazia.
 */
export function normalizeDecimalInput(value: string): string {
  const normalized = value.trim().replace(",", ".");
  return DECIMAL_INPUT_PATTERN.test(normalized) ? normalized : "";
}

/** Converte apenas decimais válidos e finitos; falhas retornam `NaN`. */
export function parseFiniteMoneyNumber(value: string): number {
  const normalized = normalizeDecimalInput(value);
  if (!normalized) {
    return Number.NaN;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
