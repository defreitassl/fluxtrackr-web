import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationButton() {
  return (
    <Link aria-label="Abrir notificações" className="icon-button" href="/notifications">
      <Bell aria-hidden="true" size={18} />
    </Link>
  );
}
