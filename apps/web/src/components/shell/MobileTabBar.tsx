"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TABS, isNavActive } from "./nav";

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-full bg-ink-strong px-3 py-2 shadow-pop lg:hidden">
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = isNavActive(href, pathname);
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition",
              active ? "text-white" : "text-white/45"
            )}
          >
            <span
              className={cn(
                "grid h-7 w-11 place-items-center rounded-full transition",
                active && "bg-white/15"
              )}
            >
              <Icon size={18} strokeWidth={1.8} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
