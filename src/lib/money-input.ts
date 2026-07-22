export const MAX_DECIMAL_12_2 = 9_999_999_999.99;
export const MIN_DECIMAL_12_2 = -9_999_999_999.99;

const DECIMAL_INPUT_PATTERN = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Aceita um decimal simples com vírgula ou ponto e devolve a forma canônica
 * usada nos contratos da API. Entradas inválidas retornam string vazia.
 */
export function normalizeDecimalInput(value: string): string {
  const normalized = value.trim().replace(",", ".");
  const match = DECIMAL_INPUT_PATTERN.exec(normalized);
  if (!match) {
    return "";
  }

  const [, sign, integerPart, decimalPart] = match;
  const canonicalInteger = integerPart.replace(/^0+(?=\d)/, "");
  return `${sign}${canonicalInteger}${decimalPart ? `.${decimalPart}` : ""}`;
}

/** Retorna se a entrada representa um valor persistível em `Decimal(12,2)`. */
export function isDecimal12_2(value: string): boolean {
  const normalized = normalizeDecimalInput(value);
  if (!normalized) {
    return false;
  }

  const unsigned = normalized.startsWith("-") ? normalized.slice(1) : normalized;
  const [integerPart] = unsigned.split(".");
  return integerPart.length <= 10;
}

/** Converte apenas decimais válidos e finitos; falhas retornam `NaN`. */
export function parseFiniteMoneyNumber(value: string): number {
  if (!isDecimal12_2(value)) {
    return Number.NaN;
  }

  const normalized = normalizeDecimalInput(value);
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= MIN_DECIMAL_12_2 && parsed <= MAX_DECIMAL_12_2
    ? parsed
    : Number.NaN;
}

/**
 * Forma canônica para payloads `Money` da API que exigem exatamente duas
 * casas decimais (ex.: `limitAmount` de orçamentos): `1500` → `1500.00`.
 * Entradas inválidas retornam string vazia, como em `normalizeDecimalInput`.
 */
export function toApiMoney(value: string): string {
  const normalized = normalizeDecimalInput(value);
  if (!normalized) {
    return "";
  }

  const [integerPart, decimalPart = ""] = normalized.split(".");
  return `${integerPart}.${decimalPart.padEnd(2, "0")}`;
}
