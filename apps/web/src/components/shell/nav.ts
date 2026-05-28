import { Home, Users, FileText, Sparkles, Library, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Full sidebar navigation (desktop). */
export const NAV: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My Groups", href: "/groups", icon: Users },
  { label: "Assignments", href: "/", icon: FileText },
  { label: "AI Teacher's Toolkit", href: "/toolkit", icon: Sparkles },
  { label: "My Library", href: "/library", icon: Library },
];

/** Bottom tab bar (mobile) — 4 primary destinations (Figma). */
export const TABS: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Assignments", href: "/", icon: FileText },
  { label: "Library", href: "/library", icon: Library },
  { label: "AI Toolkit", href: "/toolkit", icon: Sparkles },
];

export function isNavActive(href: string, pathname: string): boolean {
  return href === "/"
    ? pathname === "/" || pathname.startsWith("/assignments")
    : pathname === href || pathname.startsWith(href);
}
