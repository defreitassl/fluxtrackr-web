import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getSessionIdentity } from "@/lib/session";

export default async function AuthenticatedLayout({ children }: React.PropsWithChildren) {
  const session = await getSessionIdentity();

  if (!session) {
    redirect("/login");
  }

  const initialCollapsed = (await cookies()).get("fluxtrackr_sidebar")?.value === "collapsed";

  return (
    <AppShell email={session.email} initialCollapsed={initialCollapsed}>
      {children}
    </AppShell>
  );
}
