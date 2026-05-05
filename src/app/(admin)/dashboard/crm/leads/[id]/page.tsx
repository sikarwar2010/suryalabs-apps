import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Home,
  Mail,
  MapPin,
  Phone,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@/actions/crm.actions";
import { LeadStatusActions } from "@/components/crm/leadstatusactions";
import { requirePermission } from "@/lib/auth/rbac";
import {
  calculatePMSuryaGharSubsidy,
  formatCurrency,
  formatDate,
} from "@/lib/utlis/helpers";

const STATUS_STYLE: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  survey_scheduled: "bg-indigo-100 text-indigo-800",
  survey_done: "bg-cyan-100 text-cyan-800",
  quotation_sent: "bg-purple-100 text-purple-800",
  negotiation: "bg-orange-100 text-orange-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  survey_scheduled: "Survey Scheduled",
  survey_done: "Survey Done",
  quotation_sent: "Quotation Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requirePermission("crm:read");
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const subsidyInfo = lead.systemSizeKw
    ? calculatePMSuryaGharSubsidy(Number(lead.systemSizeKw))
    : null;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/modules/crm"
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {lead.name}
              </h1>
              <span
                className={`status-badge ${STATUS_STYLE[lead.status] ?? "bg-gray-100 text-gray-700"}`}
              >
                {STATUS_LABELS[lead.status] ?? lead.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {lead.code} · Added {formatDate(lead.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/modules/sales/quotations/new?leadId=${lead.id}`}
            className="btn-primary text-sm"
          >
            <FileText className="h-4 w-4" />
            Create Quotation
          </Link>
        </div>
      </div>

      {/* Pipeline progress */}
      <div className="card p-5">
        <div className="flex items-center gap-1">
          {[
            "new",
            "contacted",
            "survey_scheduled",
            "survey_done",
            "quotation_sent",
            "negotiation",
            "won",
          ].map((s, i, arr) => {
            const statuses = [
              "new",
              "contacted",
              "survey_scheduled",
              "survey_done",
              "quotation_sent",
              "negotiation",
              "won",
            ];
            const currentIdx = statuses.indexOf(lead.status);
            const isCompleted = currentIdx > i;
            const isCurrent = currentIdx === i;
            return (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex-1 h-1.5 rounded-full ${
                    isCompleted
                      ? "bg-orange-500"
                      : isCurrent
                        ? "bg-orange-300"
                        : "bg-gray-100"
                  }`}
                />
                {i === arr.length - 1 && (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted || isCurrent ? "bg-orange-500" : "bg-gray-100"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3 w-3 ${isCompleted || isCurrent ? "text-white" : "text-gray-300"}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {[
            "New",
            "Contacted",
            "Survey",
            "Done",
            "Quotation",
            "Negotiation",
            "Won",
          ].map((label, i) => {
            const statuses = [
              "new",
              "contacted",
              "survey_scheduled",
              "survey_done",
              "quotation_sent",
              "negotiation",
              "won",
            ];
            const currentIdx = statuses.indexOf(lead.status);
            return (
              <span
                key={label}
                className={`text-xs ${currentIdx >= i ? "text-orange-600 font-medium" : "text-gray-400"}`}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Contact Information
          </h3>
          <div className="space-y-2.5">
            <InfoRow icon={Phone} label="Mobile" value={lead.phone} />
            <InfoRow icon={Mail} label="Email" value={lead.email ?? "—"} />
            <InfoRow
              icon={MapPin}
              label="Location"
              value={
                [lead.city, lead.state, lead.pincode]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
            <InfoRow
              icon={Calendar}
              label="Source"
              value={lead.source ?? "Direct"}
            />
          </div>
        </div>

        {/* Solar Details */}
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Solar Requirements
          </h3>
          <div className="space-y-2.5">
            <InfoRow
              icon={Home}
              label="Roof Type"
              value={lead.roofType?.replace(/_/g, " ") ?? "—"}
            />
            <InfoRow
              icon={Home}
              label="Roof Area"
              value={lead.roofArea ? `${lead.roofArea} sq ft` : "—"}
            />
            <InfoRow
              icon={Zap}
              label="System Size"
              value={lead.systemSizeKw ? `${lead.systemSizeKw} kWp` : "—"}
            />
            <InfoRow
              icon={Zap}
              label="Monthly Bill"
              value={lead.monthlyBill ? formatCurrency(lead.monthlyBill) : "—"}
            />
          </div>
        </div>

        {/* Subsidy Estimate */}
        {subsidyInfo && (
          <div className="card p-5 bg-green-50 border-green-100">
            <h3 className="text-sm font-semibold text-green-800 mb-3">
              PM Surya Ghar Subsidy Estimate
            </h3>
            <div className="space-y-2">
              {subsidyInfo.breakdown.map((b) => (
                <div key={b.label} className="flex justify-between text-sm">
                  <span className="text-green-700">{b.label}</span>
                  <span className="font-medium text-green-800">
                    {formatCurrency(b.amount)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-green-200 flex justify-between">
                <span className="font-semibold text-green-800">
                  Total Subsidy
                </span>
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(subsidyInfo.eligibleSubsidy)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {lead.notes}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <LeadStatusActions lead={lead} />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-700">{value}</p>
      </div>
    </div>
  );
}
