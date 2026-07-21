"use client";

import { QueryProvider } from "@/providers/query-provider";
import { SearchProvider } from "@/providers/search-provider";
import { SessionProvider } from "@/providers/session-provider";
import { type Theme, ThemeProvider } from "@/providers/theme-provider";

type ProvidersProps = React.PropsWithChildren<{
  initialTheme: Theme;
}>;

export function Providers({ children, initialTheme }: ProvidersProps) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <QueryProvider>
        <SessionProvider>
          <SearchProvider>{children}</SearchProvider>
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
