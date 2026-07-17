import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getSessionIdentity } from "@/lib/session";

export default async function AuthenticatedLayout({ children }: React.PropsWithChildren) {
  const session = await getSessionIdentity();

  if (!session) {
    redirect("/login");
  }

  return <AppShell email={session.email}>{children}</AppShell>;
}
