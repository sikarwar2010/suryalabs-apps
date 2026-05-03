import { DashboardShell } from "@/components/common/DashboardShell";
import { requireAuth } from "@/lib/auth/rbac";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
