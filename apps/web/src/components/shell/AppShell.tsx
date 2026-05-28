import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileHeader } from "./MobileHeader";
import { MobileTabBar } from "./MobileTabBar";

export function AppShell({
  crumbs,
  children,
}: {
  crumbs: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-page lg:flex-row lg:gap-3 lg:p-3">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile header */}
      <MobileHeader />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:gap-3">
        {/* Desktop topbar */}
        <div className="hidden lg:block">
          <TopBar crumbs={crumbs} />
        </div>
        <main className="flex-1 overflow-y-auto pb-24 lg:rounded-2xl lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </div>
  );
}
