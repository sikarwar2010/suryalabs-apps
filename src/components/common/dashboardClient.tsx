"use client";

import {
  AlertCircle,
  FileCheck,
  IndianRupee,
  ShoppingCart,
  Sun,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utlis/helpers";

interface DashboardStats {
  activeLeads: number;
  conversionRate: string;
  confirmedOrders: number;
  completedInstalls: number;
  pendingSubsidy: number;
  revenueData?: {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
  };
  monthlyRevenue: { month: string; revenue: number; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  subsidyByStatus: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#f97316",
  in_production: "#3b82f6",
  ready_dispatch: "#8b5cf6",
  dispatched: "#06b6d4",
  installed: "#10b981",
  invoiced: "#84cc16",
  closed: "#6b7280",
  draft: "#e5e7eb",
  new: "#fbbf24",
  contacted: "#fb923c",
  survey_scheduled: "#60a5fa",
  survey_done: "#34d399",
  quotation_sent: "#a78bfa",
  won: "#10b981",
  lost: "#ef4444",
};

const SUBSIDY_COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#fbbf24",
  "#06b6d4",
];

function formatTooltipCurrency(value: unknown) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return formatCurrency(Number(rawValue ?? 0));
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function DashboardClient({ stats }: { stats: DashboardStats }) {
  const revenue = stats.revenueData;
  const chartData = stats.monthlyRevenue.map((d) => ({
    ...d,
    revenue: Number(d.revenue),
  }));

  const pieData = stats.ordersByStatus
    .filter((s) => s.status !== "draft")
    .map((s) => ({
      name: s.status.replace(/_/g, " "),
      value: Number(s.count),
      color: STATUS_COLORS[s.status] ?? "#94a3b8",
    }));

  const subsidyPie = stats.subsidyByStatus.map((s, i) => ({
    name: s.status.replace(/_/g, " "),
    value: Number(s.count),
    color: SUBSIDY_COLORS[i % SUBSIDY_COLORS.length] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard
          title="Active Leads"
          value={stats.activeLeads}
          subtitle={`${stats.conversionRate}% conversion rate`}
          icon={Users}
          color="bg-orange-500"
        />
        <KPICard
          title="Sales Orders"
          value={stats.confirmedOrders}
          subtitle="All time"
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <KPICard
          title="Installations Done"
          value={stats.completedInstalls}
          subtitle="Systems commissioned"
          icon={Sun}
          color="bg-green-500"
        />
        <KPICard
          title="Pending Subsidy"
          value={stats.pendingSubsidy}
          subtitle="Claims in progress"
          icon={FileCheck}
          color="bg-purple-500"
        />
        <KPICard
          title="Total Revenue"
          value={formatCurrency(revenue?.totalRevenue ?? 0)}
          subtitle="Invoiced"
          icon={IndianRupee}
          color="bg-emerald-500"
        />
        <KPICard
          title="Amount Collected"
          value={formatCurrency(revenue?.totalPaid ?? 0)}
          subtitle="Payments received"
          icon={TrendingUp}
          color="bg-cyan-500"
        />
        <KPICard
          title="Outstanding"
          value={formatCurrency(revenue?.totalPending ?? 0)}
          subtitle="Pending collection"
          icon={AlertCircle}
          color="bg-red-500"
        />
        <KPICard
          title="Technician Jobs"
          value={stats.confirmedOrders}
          subtitle="Field assignments"
          icon={Wrench}
          color="bg-amber-500"
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-medium text-gray-800">
          Monthly Revenue
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(Number(v) / 100000).toFixed(0)}L`}
            />
            <Tooltip formatter={formatTooltipCurrency} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#revGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-medium text-gray-800">
            Orders by Status
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              No orders yet
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-medium text-gray-800">
            Subsidy Pipeline
          </h2>
          {subsidyPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subsidyPie} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {subsidyPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              No subsidy claims yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
