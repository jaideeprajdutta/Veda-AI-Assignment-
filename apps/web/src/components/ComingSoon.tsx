import Link from "next/link";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";

export function ComingSoon({ title }: { title: string }) {
  return (
    <AppShell crumbs={[title]}>
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="anim-fade-up flex max-w-md flex-col items-center rounded-card border border-dashed border-surface-border bg-white px-8 py-16 text-center shadow-card">
          <span className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-surface-fill text-ink-muted">
            <Construction size={30} />
          </span>
          <h1 className="text-2xl font-extrabold leading-[1.2] tracking-tighter text-ink-strong">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            This page isn&apos;t ready yet. Head over to Assignments to create and
            generate question papers.
          </p>
          <Link href="/" className="mt-6">
            <Button variant="brand">Go to Assignments</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
