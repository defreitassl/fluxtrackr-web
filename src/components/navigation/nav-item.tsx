"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

type NavItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: number;
};

export function NavItem({ href, icon: Icon, label, active, badge }: NavItemProps) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn("nav-item", active && "nav-item-active")}
      href={href}
      title={label}
    >
      <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.1 : 1.8} />
      <span className="sidebar-label">{label}</span>
      {badge !== undefined && badge > 0 ? (
        <span className="nav-badge sidebar-label">{badge}</span>
      ) : null}
    </Link>
  );
}
