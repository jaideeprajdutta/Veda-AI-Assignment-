import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/logo-mark.png"
        alt="VedaAI"
        className="h-12 w-12 shrink-0 rounded-xl object-cover"
      />
      <span className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.06em] text-ink-strong">
        VedaAI
      </span>
    </div>
  );
}
