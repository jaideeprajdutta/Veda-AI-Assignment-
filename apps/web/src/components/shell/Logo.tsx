import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/logo-mark.png"
        alt="VedaAI"
        className="h-[50px] w-[50px] shrink-0 rounded-xl object-cover"
      />
      <span className="relative top-[1px] text-[30px] font-extrabold leading-none tracking-[-0.06em] text-ink-strong">
        VedaAI
      </span>
    </div>
  );
}
