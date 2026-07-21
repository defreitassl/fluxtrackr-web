"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

type SidebarProfileProps = {
  email: string;
};

function getDisplayName(email: string) {
  const localPart = email.split("@")[0] ?? email;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function SidebarProfile({ email }: SidebarProfileProps) {
  const router = useRouter();
  const name = getDisplayName(email);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="sidebar-profile">
      <span className="profile-avatar" aria-hidden="true">
        {getInitials(name)}
      </span>
      <span className="profile-identity sidebar-label" title={email}>
        <strong>{name}</strong>
        <span>Conta pessoal</span>
      </span>
      <button
        aria-label="Sair da conta"
        className="profile-logout sidebar-label"
        onClick={logout}
        title="Sair"
        type="button"
      >
        <LogOut aria-hidden="true" size={15} />
      </button>
    </div>
  );
}
