import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = React.PropsWithChildren<{
  email: string;
}>;

export function AppShell({ children, email }: AppShellProps) {
  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="app-content">
        <AppHeader email={email} />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
