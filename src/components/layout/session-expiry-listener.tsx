"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Quando a API responde 401 (token expirado), o cliente HTTP dispara
 * `fluxtrackr:unauthorized`. Redireciona para o login com o estado de
 * sessão expirada em vez de deixar as telas em erro.
 */
export function SessionExpiryListener() {
  const router = useRouter();

  useEffect(() => {
    function onUnauthorized() {
      router.replace("/login?state=expired");
      router.refresh();
    }
    window.addEventListener("fluxtrackr:unauthorized", onUnauthorized);
    return () => window.removeEventListener("fluxtrackr:unauthorized", onUnauthorized);
  }, [router]);

  return null;
}
