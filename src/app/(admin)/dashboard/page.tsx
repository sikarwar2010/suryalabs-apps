import { count, sql } from "drizzle-orm";
import { Suspense } from "react";
import { DashboardClient } from "@/components/common/dashboardClient";
import db from "@/db";
import {
  installations,
  leads,
  salesInvoices,
  salesOrders,
  subsidyClaims,
} from "@/db/schema/index";
import { requireAuth } from "@/lib/auth/rbac";

const SKELETON_CARDS = [
  "active-leads",
  "sales-orders",
  "installations",
  "subsidy",
  "revenue",
  "collected",
  "outstanding",
  "technician-jobs",
];

async function getDashboardStats() {
  const [
    leadStats,
    orderStats,
    installStats,
    subsidyStats,
    revenueData,
    monthlyRevenue,
  ] = await Promise.all([
    db
      .select({ status: leads.status, count: count() })
      .from(leads)
      .groupBy(leads.status),

    db
      .select({ status: salesOrders.status, count: count() })
      .from(salesOrders)
      .groupBy(salesOrders.status),

    db
      .select({ status: installations.status, count: count() })
      .from(installations)
      .groupBy(installations.status),

    db
      .select({ status: subsidyClaims.status, count: count() })
      .from(subsidyClaims)
      .groupBy(subsidyClaims.status),

    db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${salesInvoices.totalAmount}), 0)`,
        totalPaid: sql<number>`coalesce(sum(${salesInvoices.paidAmount}), 0)`,
        totalPending: sql<number>`coalesce(sum(${salesInvoices.netPayable}) - sum(${salesInvoices.paidAmount}), 0)`,
      })
      .from(salesInvoices),

    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${salesOrders.createdAt}), 'Mon')`,
        revenue: sql<number>`coalesce(sum(${salesOrders.totalAmount}), 0)`,
        count: count(),
      })
      .from(salesOrders)
      .groupBy(sql`date_trunc('month', ${salesOrders.createdAt})`)
      .orderBy(sql`date_trunc('month', ${salesOrders.createdAt})`)
      .limit(12),
  ]);

  const activeLeads = leadStats
    .filter((lead) => !["won", "lost"].includes(lead.status))
    .reduce((total, lead) => total + Number(lead.count), 0);

  const wonLeads = leadStats.find((lead) => lead.status === "won")?.count ?? 0;
  const totalLeads = leadStats.reduce(
    (total, lead) => total + Number(lead.count),
    0,
  );
  const conversionRate =
    totalLeads > 0 ? ((Number(wonLeads) / totalLeads) * 100).toFixed(1) : "0";

  const confirmedOrders = orderStats.reduce(
    (total, order) => total + Number(order.count),
    0,
  );
  const completedInstalls =
    installStats.find((install) => install.status === "completed")?.count ?? 0;
  const pendingSubsidy = subsidyStats
    .filter(
      (subsidy) =>
        !["subsidy_received", "rejected", "not_applied"].includes(
          subsidy.status,
        ),
    )
    .reduce((total, subsidy) => total + Number(subsidy.count), 0);

  return {
    activeLeads,
    conversionRate,
    confirmedOrders,
    completedInstalls: Number(completedInstalls),
    pendingSubsidy,
    revenueData: revenueData[0],
    monthlyRevenue,
    ordersByStatus: orderStats,
    subsidyByStatus: subsidyStats,
  };
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const stats = await getDashboardStats();
  const firstName = session.user.name.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          PM Surya Ghar ERP - Solar Vendor Dashboard
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient stats={stats} />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {SKELETON_CARDS.map((card) => (
        <div key={card} className="h-24 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}
