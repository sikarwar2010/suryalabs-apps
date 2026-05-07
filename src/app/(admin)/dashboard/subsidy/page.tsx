import { requirePermission } from "@/lib/auth/rbac";
import { getSubsidyClaims, getSubsidyStats } from "@/actions/subsidy.actions";
import { formatDate, formatCurrency } from "@/lib/utlis/helpers";
import Link from "next/link";
import { Plus, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const SUBSIDY_STAGES = [
  { key: "eligibility_check", label: "Eligibility", icon: "🔍" },
  { key: "docs_uploaded", label: "Docs Ready", icon: "📄" },
  { key: "discom_submitted", label: "DISCOM Filed", icon: "📮" },
  { key: "discom_approved", label: "Approved", icon: "✅" },
  { key: "claim_submitted", label: "Claim Filed", icon: "📋" },
  { key: "subsidy_received", label: "Received", icon: "💰" },
];

const STATUS_STYLE: Record<string, string> = {
  not_applied: "bg-gray-100 text-gray-600",
  eligibility_check: "bg-yellow-100 text-yellow-800",
  docs_uploaded: "bg-blue-100 text-blue-800",
  discom_submitted: "bg-indigo-100 text-indigo-800",
  discom_approved: "bg-cyan-100 text-cyan-800",
  claim_submitted: "bg-purple-100 text-purple-800",
  subsidy_received: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  not_applied: "Not Applied",
  eligibility_check: "Eligibility Check",
  docs_uploaded: "Docs Uploaded",
  discom_submitted: "DISCOM Submitted",
  discom_approved: "DISCOM Approved",
  claim_submitted: "Claim Submitted",
  subsidy_received: "Subsidy Received",
  rejected: "Rejected",
};

export default async function SubsidyClaimsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  await requirePermission("subsidy:read");

  const params = await searchParams;
  const [{ claims, total, totalPages }, stats] = await Promise.all([
    getSubsidyClaims({
      status: params.status,
      page: Number(params.page ?? 1),
    }),
    getSubsidyStats(),
  ]);

  const statsMap = Object.fromEntries(
    stats.map((s) => [s.status, Number(s.count)]),
  );

  const totalSubsidyPending = claims
    .filter((c) => !["subsidy_received", "rejected"].includes(c.status))
    .reduce((a, c) => a + Number(c.eligibleSubsidyAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            PM Surya Ghar — Subsidy Claims
          </h1>
          <p className="text-sm text-gray-500">{total} total claims</p>
        </div>
        <Link href="/dashboard/modules/subsidy/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          New Claim
        </Link>
      </div>

      {/* Pipeline funnel */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Subsidy Pipeline
        </h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {SUBSIDY_STAGES.map((stage, i) => (
            <Link
              key={stage.key}
              href={`/dashboard/modules/subsidy?status=${stage.key}`}
              className="flex items-center gap-1 group shrink-0"
            >
              <div
                className={`px-4 py-3 rounded-lg text-center min-w-27.5 transition-colors
                ${
                  params.status === stage.key
                    ? "bg-orange-500 text-white"
                    : "bg-gray-50 hover:bg-orange-50 text-gray-700"
                }`}
              >
                <p className="text-lg mb-0.5">{stage.icon}</p>
                <p className="text-xs font-medium">{stage.label}</p>
                <p className="text-lg font-bold mt-0.5">
                  {statsMap[stage.key] ?? 0}
                </p>
              </div>
              {i < SUBSIDY_STAGES.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
              )}
            </Link>
          ))}
          <Link
            href={`/dashboard/modules/subsidy?status=rejected`}
            className="ml-2 px-3 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-center min-w-22.5 shrink-0"
          >
            <p className="text-lg mb-0.5">❌</p>
            <p className="text-xs font-medium text-red-600">Rejected</p>
            <p className="text-lg font-bold text-red-700 mt-0.5">
              {statsMap.rejected ?? 0}
            </p>
          </Link>
        </div>

        {totalSubsidyPending > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-sm text-green-700">
              <span className="font-semibold">
                {formatCurrency(totalSubsidyPending)}
              </span>{" "}
              total eligible subsidy across active claims
            </p>
          </div>
        )}
      </div>

      {/* Claims list */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Customer</th>
              <th>System</th>
              <th>Eligible Subsidy</th>
              <th>Status</th>
              <th>DISCOM Ref.</th>
              <th>Last Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No subsidy claims yet
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id}>
                  <td className="font-mono text-xs">{claim.code}</td>
                  <td className="text-gray-700">{claim.customerId}</td>
                  <td>
                    <span className="font-medium">
                      {claim.systemSizeKw} kWp
                    </span>
                    <br />
                    <span className="text-xs text-gray-400 capitalize">
                      {claim.subsidyCategory}
                    </span>
                  </td>
                  <td className="font-medium text-green-700">
                    {formatCurrency(claim.eligibleSubsidyAmount ?? 0)}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${STATUS_STYLE[claim.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {STATUS_LABELS[claim.status] ?? claim.status}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">
                    {claim.discomApplicationNumber ?? "—"}
                  </td>
                  <td className="text-sm text-gray-500">
                    {formatDate(claim.updatedAt)}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/modules/subsidy/${claim.id}`}
                      className="text-orange-500 hover:text-orange-700 text-sm font-medium"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Page {Number(params.page ?? 1)} of {totalPages} · {total} claims
          </p>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/modules/subsidy?status=${params.status ?? ""}&page=${Math.max(1, Number(params.page ?? 1) - 1)}`}
              aria-disabled={Number(params.page ?? 1) <= 1}
              className={`btn-secondary py-1.5 px-3 ${Number(params.page ?? 1) <= 1 ? "pointer-events-none opacity-40" : ""}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/modules/subsidy?status=${params.status ?? ""}&page=${Math.min(totalPages, Number(params.page ?? 1) + 1)}`}
              aria-disabled={Number(params.page ?? 1) >= totalPages}
              className={`btn-secondary py-1.5 px-3 ${Number(params.page ?? 1) >= totalPages ? "pointer-events-none opacity-40" : ""}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
