"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { NAV, isNavActive } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => isNavActive(href, pathname);

  return (
    <aside className="flex h-full w-[288px] flex-col justify-between rounded-2xl bg-white p-6 shadow-[0px_16px_24px_rgba(0,0,0,0.06),0px_24px_48px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-10">
        <Logo />

        {/* Create Assignment — dark pill with orange ring + inner glow (Figma). */}
        <button
          onClick={() => router.push("/create")}
          className="relative flex w-full items-center justify-center gap-2 rounded-full border-4 border-brand-light bg-[#272727] px-6 py-2 font-body text-[16px] font-medium text-white"
          style={{
            boxShadow:
              "inset 0 -1px 3.5px rgba(177,177,177,0.6), inset 0 0 34.5px rgba(255,255,255,0.25)",
          }}
        >
          <Sparkles size={17} />
          Create Assignment
        </button>

        <nav className="flex flex-col gap-2">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-[16px] transition",
                  active
                    ? "bg-surface-fill font-medium text-ink-strong"
                    : "font-normal text-ink-soft/80 hover:bg-surface-fill/60 hover:text-ink"
                )}
              >
                <Icon size={20} strokeWidth={1.8} className="shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[16px] font-normal text-ink-soft/80 hover:bg-surface-fill"
        >
          <Settings size={20} strokeWidth={1.8} /> Settings
        </Link>

        <div className="flex items-center gap-2 rounded-2xl bg-surface-fill p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/figma/school-avatar.png"
            alt="School"
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[16px] font-bold text-ink-strong">Delhi Public School</p>
            <p className="truncate text-[14px] text-ink-soft">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
