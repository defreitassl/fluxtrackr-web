"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

type UserMenuProps = {
  email: string;
};

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter();
  const initial = email.slice(0, 1).toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="user-menu">
      <span className="avatar" aria-hidden="true">
        {initial}
      </span>
      <span className="user-identity">
        <strong>{email}</strong>
        <small>Sessão ativa</small>
      </span>
      <button className="logout-button" onClick={logout} type="button">
        <LogOut aria-hidden="true" size={16} />
        <span>Sair</span>
      </button>
    </div>
  );
}
