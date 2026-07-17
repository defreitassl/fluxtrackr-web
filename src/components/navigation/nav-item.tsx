"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

type NavItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
};

export function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn("nav-item", active && "nav-item-active")}
      href={href}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={active ? 2.3 : 1.8} />
      <span>{label}</span>
    </Link>
  );
}
