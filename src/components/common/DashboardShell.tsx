"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { TopBar } from "@/components/common/Topbar";

type DashboardShellProps = {
  children: React.ReactNode;
  user: { name: string; email: string; role?: string | null };
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-slate-50">
      <Sidebar
        user={user}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
