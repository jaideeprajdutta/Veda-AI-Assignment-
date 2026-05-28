"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

/** Floating "+" action button on mobile (sits above the floating tab bar). */
export function MobileFab() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/create")}
      aria-label="Create assignment"
      className="bg-brand-gradient fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full text-white shadow-pop transition active:scale-95 lg:hidden"
    >
      <Plus size={26} />
    </button>
  );
}
