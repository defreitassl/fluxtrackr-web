export type WalletPeriod = {
  year: number;
  month: number;
};

export function getCurrentUtcWalletPeriod(reference = new Date()): WalletPeriod {
  return {
    year: reference.getUTCFullYear(),
    month: reference.getUTCMonth() + 1,
  };
}
