import { Plus } from "lucide-react";
import Link from "next/link";
import { getLeads, getPipelineSummary } from "@/actions/crm.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LeadsTable } from "@/components/crm/leads-table";
import { requirePermission } from "@/lib/auth/rbac";
import { leadStatusValues } from "@/schema/crm.schema";

type LeadStatus = (typeof leadStatusValues)[number];

type SearchParams = Promise<{
  status?: string | string[];
  page?: string | string[];
  search?: string | string[];
}>;

const STATUS_VARIANTS: Record<
  LeadStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "secondary",
  contacted: "default",
  survey_scheduled: "outline",
  survey_done: "outline",
  quotation_sent: "outline",
  negotiation: "secondary",
  won: "default",
  lost: "destructive",
};

const STATUS_LABELS: Record<LeadStatus, { label: string }> = {
  new: { label: "New" },
  contacted: { label: "Contacted" },
  survey_scheduled: { label: "Survey Scheduled" },
  survey_done: { label: "Survey Done" },
  quotation_sent: { label: "Quotation Sent" },
  negotiation: { label: "Negotiation" },
  won: { label: "Won" },
  lost: { label: "Lost" },
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): LeadStatus | undefined {
  return leadStatusValues.includes(value as LeadStatus)
    ? (value as LeadStatus)
    : undefined;
}

function buildCrmHref(params: {
  page?: number;
  status?: LeadStatus;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.set("page", params.page.toString());
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  const queryString = query.toString();
  return queryString ? `/dashboard/crm?${queryString}` : "/dashboard/crm";
}

export default async function CRMLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("crm:read");

  const params = await searchParams;
  const pageParam = Number(firstParam(params.page) ?? 1);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const status = parseStatus(firstParam(params.status));
  const search = firstParam(params.search)?.trim() || undefined;

  const [{ leads, total, totalPages }, pipelineSummary] = await Promise.all([
    getLeads({ status, search, page, pageSize: 20 }),
    getPipelineSummary(),
  ]);

  const pipeline = Object.fromEntries(
    pipelineSummary.map((summary) => [summary.status, Number(summary.count)]),
  ) as Partial<Record<LeadStatus, number>>;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            CRM - Lead Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} total leads
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/leads">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Link>
        </Button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {leadStatusValues.map((statusValue) => {
          const { label } = STATUS_LABELS[statusValue];
          const count = pipeline[statusValue] ?? 0;
          const isActive = status === statusValue;

          return (
            <Link
              key={statusValue}
              href={buildCrmHref({ status: statusValue, search })}
              className="group"
            >
              <Card
                className={`transition-all duration-200 hover:shadow-md ${isActive ? "ring-2 ring-primary" : ""}`}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {count}
                  </div>
                  <Badge
                    variant={STATUS_VARIANTS[statusValue]}
                    className="mt-1 text-xs"
                  >
                    {label}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Status Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Link href={buildCrmHref({ search })} className="inline-flex">
              <Badge
                variant={!status ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                All
              </Badge>
            </Link>
            {leadStatusValues.map((statusValue) => (
              <Link
                key={statusValue}
                href={buildCrmHref({ status: statusValue, search })}
                className="inline-flex"
              >
                <Badge
                  variant={
                    status === statusValue
                      ? STATUS_VARIANTS[statusValue]
                      : "outline"
                  }
                  className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:shadow-sm"
                >
                  {STATUS_LABELS[statusValue].label}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground">
              No leads found
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start by adding your first lead
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/crm/leads">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <LeadsTable leads={leads} />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildCrmHref({ page: page - 1, status, search })}
                    />
                  </PaginationItem>
                )}
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href={buildCrmHref({ page: pageNumber, status, search })}
                      isActive={pageNumber === page}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href={buildCrmHref({ page: page + 1, status, search })}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
