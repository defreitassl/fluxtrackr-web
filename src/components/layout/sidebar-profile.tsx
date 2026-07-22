"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useMe } from "@/features/settings/queries/use-me";

type SidebarProfileProps = {
  email: string;
};

function fallbackName(email: string) {
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
  const { data: me } = useMe();
  const name = me?.name ?? fallbackName(email);

  async function logout(event: React.MouseEvent) {
    event.stopPropagation();
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/login?state=logout");
    router.refresh();
  }

  function openProfile() {
    router.push("/settings");
  }

  return (
    <div
      aria-label="Abrir perfil e configurações"
      className="sidebar-profile"
      onClick={openProfile}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProfile();
        }
      }}
      role="link"
      style={{ cursor: "pointer" }}
      tabIndex={0}
    >
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
