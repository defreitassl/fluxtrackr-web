import { NotificationButton } from "@/components/layout/notification-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

type AppHeaderProps = {
  email: string;
};

export function AppHeader({ email }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-context">
        <span className="header-kicker">FluxTrackr</span>
        <span className="header-status">Organize. Antecipe. Decida.</span>
      </div>
      <div className="header-actions">
        <ThemeToggle />
        <NotificationButton />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
