"use client";

import { useCallback, useEffect, useState } from "react";

import { getCurrentUtcWalletPeriod, type WalletPeriod } from "@/features/wallet/lib/wallet-period";

function isSamePeriod(a: WalletPeriod, b: WalletPeriod) {
  return a.year === b.year && a.month === b.month;
}

/**
 * Mantém o período UTC atual da Carteira sem congelá-lo durante toda a vida do
 * componente. O recálculo acontece no mount, ao recuperar o foco da janela,
 * quando a aba volta a ficar visível e antes de uma atualização manual.
 *
 * Não usa polling nem intervalos: foco e visibilidade cobrem a virada de mês
 * para o escopo deste MVP.
 */
export function useCurrentWalletPeriod() {
  const [period, setPeriod] = useState<WalletPeriod>(() => getCurrentUtcWalletPeriod());

  const refreshPeriod = useCallback(() => {
    const next = getCurrentUtcWalletPeriod();
    setPeriod((current) => (isSamePeriod(current, next) ? current : next));
    return next;
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      refreshPeriod();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshPeriod();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshPeriod]);

  return { period, refreshPeriod };
}
