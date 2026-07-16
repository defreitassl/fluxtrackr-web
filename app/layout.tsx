import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FluxTrackr Web",
  description: "Interface web do FluxTrackr.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
