"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateLead } from "@/actions/crm.actions";
import { Button } from "@/components/ui/button";

const STATUS_TRANSITIONS: Record<
  string,
  { label: string; next: string; color: string }
> = {
  new: {
    label: "Mark Contacted",
    next: "contacted",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  contacted: {
    label: "Schedule Survey",
    next: "survey_scheduled",
    color: "bg-indigo-500 hover:bg-indigo-600",
  },
  survey_scheduled: {
    label: "Survey Completed",
    next: "survey_done",
    color: "bg-cyan-500 hover:bg-cyan-600",
  },
  survey_done: {
    label: "Send Quotation",
    next: "quotation_sent",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  quotation_sent: {
    label: "Move to Negotiation",
    next: "negotiation",
    color: "bg-orange-500 hover:bg-orange-600",
  },
  negotiation: {
    label: "Mark Won",
    next: "won",
    color: "bg-green-500 hover:bg-green-600",
  },
};

interface Lead {
  id: string;
  status: string;
  name: string;
}

export function LeadStatusActions({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [showLostDialog, setShowLostDialog] = useState(false);

  const transition = STATUS_TRANSITIONS[lead.status];

  async function advanceStatus() {
    if (!transition) return;
    setLoading(true);
    try {
      await updateLead(lead.id, {
        status: transition.next as
          | "contacted"
          | "survey_scheduled"
          | "survey_done"
          | "quotation_sent"
          | "negotiation"
          | "won",
      });
      toast.success(
        `Status updated to "${transition.next.replace(/_/g, " ")}"`,
      );
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message ?? "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  async function markLost() {
    setLoading(true);
    try {
      await updateLead(lead.id, {
        status: "lost" as "lost",
        lostReason,
      });
      toast.success("Lead marked as lost");
      setShowLostDialog(false);
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message ?? "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  if (lead.status === "won" || lead.status === "lost") {
    return (
      <div
        className={`card p-4 text-center text-sm font-medium ${
          lead.status === "won"
            ? "text-green-700 bg-green-50 border-green-100"
            : "text-red-700 bg-red-50 border-red-100"
        }`}
      >
        {lead.status === "won"
          ? "✓ Lead Won — Customer created"
          : `✗ Lead Lost${lostReason ? `: ${lostReason}` : ""}`}
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Pipeline Actions
      </h3>
      <div className="flex items-center gap-3 flex-wrap">
        {transition && (
          <Button
            onClick={advanceStatus}
            disabled={loading}
            className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${transition.color}`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {transition.label}
          </Button>
        )}
        <Button
          onClick={() => setShowLostDialog(true)}
          disabled={loading}
          className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-sm"
        >
          Mark as Lost
        </Button>
      </div>

      {/* Lost reason dialog */}
      {showLostDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Mark Lead as Lost
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for losing this lead.
            </p>
            <textarea
              className="form-textarea mb-4"
              rows={3}
              placeholder="e.g. Customer chose competitor, budget constraints, site not suitable…"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowLostDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={markLost}
                disabled={loading || !lostReason.trim()}
                className="btn-danger"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Lost
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
