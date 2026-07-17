"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function SessionProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = () => {
      void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).finally(() => {
        router.replace("/login");
        router.refresh();
      });
    };

    window.addEventListener("fluxtrackr:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("fluxtrackr:unauthorized", handleUnauthorized);
  }, [router]);

  return children;
}
