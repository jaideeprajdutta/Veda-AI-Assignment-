"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, X, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { NAV, isNavActive } from "./nav";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-white px-4 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1.5">
          <button className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft" aria-label="Notifications">
            <Bell size={20} strokeWidth={1.8} />
            <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/user-avatar.jpg" alt="" className="h-8 w-8 rounded-full object-cover" />
          <button
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft"
            aria-label="Menu"
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[280px] flex-col gap-4 bg-white p-5 shadow-pop">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-soft">
                <X size={22} />
              </button>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                router.push("/create");
              }}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-full border-4 border-brand-light bg-[#272727] px-6 py-2 font-body text-[15px] font-medium text-white"
            >
              <Plus size={16} /> Create Assignment
            </button>

            <nav className="flex flex-col gap-1">
              {NAV.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] transition",
                    isNavActive(href, pathname)
                      ? "bg-surface-fill font-medium text-ink-strong"
                      : "font-normal text-ink-soft/80"
                  )}
                >
                  <Icon size={20} strokeWidth={1.8} /> {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] text-ink-soft/80"
              >
                <Settings size={20} strokeWidth={1.8} /> Settings
              </Link>
              <div className="flex items-center gap-2 rounded-2xl bg-surface-fill p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/figma/school-avatar.png" alt="" className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[15px] font-bold text-ink-strong">Delhi Public School</p>
                  <p className="truncate text-[13px] text-ink-soft">Bokaro Steel City</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
