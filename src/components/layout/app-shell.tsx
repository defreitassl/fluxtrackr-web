"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

const SIDEBAR_COOKIE = "fluxtrackr_sidebar";

type AppShellProps = React.PropsWithChildren<{
  email: string;
  initialCollapsed?: boolean;
}>;

export function AppShell({ children, email, initialCollapsed = false }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }

  return (
    <div className="app-shell" data-collapsed={collapsed ? "true" : "false"}>
      <AppSidebar email={email} />
      <div className="app-content">
        <AppHeader onToggleSidebar={toggleSidebar} sidebarCollapsed={collapsed} />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
