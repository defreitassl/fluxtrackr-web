import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Providers } from "@/providers/providers";
import type { Theme } from "@/providers/theme-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "FluxTrackr",
    template: "%s · FluxTrackr",
  },
  description: "Gestão financeira pessoal com clareza sobre hoje e próximos passos.",
};

function getInitialTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export default async function RootLayout({ children }: Readonly<React.PropsWithChildren>) {
  const initialTheme = getInitialTheme((await cookies()).get("fluxtrackr_theme")?.value);

  return (
    <html data-theme={initialTheme === "system" ? undefined : initialTheme} lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers initialTheme={initialTheme}>{children}</Providers>
      </body>
    </html>
  );
}
