import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsScreen } from "@/features/settings/settings-screen";
import { getSessionIdentity } from "@/lib/session";

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function SettingsPage() {
  const session = await getSessionIdentity();

  if (!session) {
    redirect("/login");
  }

  return <SettingsScreen email={session.email} />;
}
