"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

/* Empty-state illustration rebuilt from the Figma layer assets. */
function Illustration() {
  return (
    <div className="relative size-[300px]">
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src="/figma/illo-bg.svg"
        alt=""
        className="absolute left-1/2 top-1/2 size-[240px] -translate-x-1/2 -translate-y-1/2"
      />
      {/* white "page" card */}
      <div className="absolute left-1/2 top-[calc(50%-9px)] h-[155px] w-[125px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-[0px_20px_30px_rgba(146,146,146,0.19)]" />
      <div className="absolute left-1/2 top-[calc(50%-6px)] flex h-[121px] w-[100px] -translate-x-1/2 -translate-y-1/2 flex-col justify-between">
        <div className="h-[10px] w-[50px] rounded-full bg-[#011625]" />
        <div className="h-[10px] w-full rounded-full bg-[#d4d4d4]" />
        <div className="h-[10px] w-full rounded-full bg-[#d4d4d4]" />
        <div className="h-[10px] w-full rounded-full bg-[#d4d4d4]" />
        <div className="h-[10px] w-full rounded-full bg-[#d4d4d4]" />
      </div>
      <img
        src="/figma/illo-doodles.svg"
        alt=""
        className="absolute left-1/2 top-1/2 h-[178px] w-[284px] -translate-x-1/2 -translate-y-1/2"
      />
      <img
        src="/figma/illo-lens.svg"
        alt=""
        className="absolute left-[calc(50%+54px)] top-[calc(50%+32px)] h-[163px] w-[163px] -translate-x-1/2 -translate-y-1/2"
      />
      <img
        src="/figma/illo-cloud.svg"
        alt=""
        className="absolute left-[calc(50%+108px)] top-[calc(50%-83px)] h-[40px] w-[70px] -translate-x-1/2 -translate-y-1/2"
      />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}

export function EmptyAssignments() {
  const router = useRouter();
  return (
    <div className="anim-fade-up flex flex-col items-center gap-8 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <Illustration />
        <div className="flex max-w-[486px] flex-col gap-0.5">
          <h2 className="text-[20px] font-bold tracking-[-0.04em] text-ink-strong">
            No assignments yet
          </h2>
          <p className="text-[16px] leading-[1.4] text-ink-soft/80">
            Create your first assignment to start collecting and grading student submissions.
            You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
        </div>
      </div>

      <button
        onClick={() => router.push("/create")}
        className="flex items-center gap-1.5 rounded-full border-[1.5px] border-white/50 bg-[#181818] px-6 py-3 text-[16px] font-medium text-white transition hover:bg-black"
      >
        <Plus size={20} strokeWidth={2} />
        Create Your First Assignment
      </button>
    </div>
  );
}
