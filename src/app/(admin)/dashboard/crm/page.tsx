import { Calendar, MapPin, Phone, Plus } from "lucide-react";
import Link from "next/link";
import { getLeads, getPipelineSummary } from "@/actions/crm.actions";
import { requirePermission } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utlis/helpers";
import { leadStatusValues } from "@/schema/crm.schema";

type LeadStatus = (typeof leadStatusValues)[number];

type SearchParams = Promise<{
	status?: string | string[];
	page?: string | string[];
	search?: string | string[];
}>;

const STATUS_LABELS: Record<LeadStatus, { label: string; color: string }> = {
	new: { label: "New", color: "bg-yellow-100 text-yellow-800" },
	contacted: { label: "Contacted", color: "bg-blue-100 text-blue-800" },
	survey_scheduled: {
		label: "Survey Scheduled",
		color: "bg-indigo-100 text-indigo-800",
	},
	survey_done: { label: "Survey Done", color: "bg-cyan-100 text-cyan-800" },
	quotation_sent: {
		label: "Quotation Sent",
		color: "bg-purple-100 text-purple-800",
	},
	negotiation: { label: "Negotiation", color: "bg-orange-100 text-orange-800" },
	won: { label: "Won", color: "bg-green-100 text-green-800" },
	lost: { label: "Lost", color: "bg-red-100 text-red-800" },
};

function firstParam(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): LeadStatus | undefined {
	return leadStatusValues.includes(value as LeadStatus) ? (value as LeadStatus) : undefined;
}

function buildCrmHref(params: { page?: number; status?: LeadStatus; search?: string }) {
	const query = new URLSearchParams();
	if (params.page && params.page > 1) query.set("page", params.page.toString());
	if (params.status) query.set("status", params.status);
	if (params.search) query.set("search", params.search);

	const queryString = query.toString();
	return queryString ? `/dashboard/crm?${queryString}` : "/dashboard/crm";
}

export default async function CRMLeadsPage({ searchParams }: { searchParams: SearchParams }) {
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
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-semibold text-gray-900">CRM - Lead Pipeline</h1>
					<p className="text-sm text-gray-500">{total} total leads</p>
				</div>
				<Link
					href="/dashboard/crm/leads"
					className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
				>
					<Plus className="h-4 w-4" />
					Add Lead
				</Link>
			</div>

			<div className="grid grid-cols-4 gap-2 md:grid-cols-8">
				{leadStatusValues.map((statusValue) => {
					const { label, color } = STATUS_LABELS[statusValue];

					return (
						<Link
							key={statusValue}
							href={buildCrmHref({ status: statusValue, search })}
							className={`rounded-lg p-3 text-center transition-opacity hover:opacity-80 ${color}`}
						>
							<div className="text-lg font-semibold">{pipeline[statusValue] ?? 0}</div>
							<div className="mt-0.5 text-xs leading-tight">{label}</div>
						</Link>
					);
				})}
			</div>

			<div className="flex flex-wrap gap-3">
				<Link
					href={buildCrmHref({ search })}
					className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
						!status
							? "border-orange-500 bg-orange-500 text-white"
							: "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
					}`}
				>
					All
				</Link>
				{leadStatusValues.map((statusValue) => (
					<Link
						key={statusValue}
						href={buildCrmHref({ status: statusValue, search })}
						className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
							status === statusValue
								? "border-orange-500 bg-orange-500 text-white"
								: "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
						}`}
					>
						{STATUS_LABELS[statusValue].label}
					</Link>
				))}
			</div>

			<div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:bg-orange-100">
				{leads.length === 0 ? (
					<div className="p-12 text-center text-gray-400">
						<p className="text-lg">No leads found</p>
						<p className="mt-1 text-sm">Start by adding your first lead</p>
					</div>
				) : (
					<div className="divide-y divide-gray-50">
						{leads.map((lead) => {
							const statusInfo = STATUS_LABELS[lead.status] ?? {
								label: lead.status,
								color: "bg-gray-100 text-gray-700",
							};

							return (
								<Link
									key={lead.id}
									href={`/dashboard/crm/leads/${lead.id}`}
									className="group flex items-center gap-4 p-4 transition-colors hover:bg-gray-50"
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-3">
											<span className="truncate font-medium text-gray-900 group-hover:text-orange-600">
												{lead.name}
											</span>
											<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
												{statusInfo.label}
											</span>
											{lead.systemSizeKw && <span className="text-xs text-gray-400">{lead.systemSizeKw} kWp</span>}
										</div>
										<div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
											<span className="flex items-center gap-1">
												<Phone className="h-3.5 w-3.5" />
												{lead.phone}
											</span>
											{lead.city && (
												<span className="flex items-center gap-1">
													<MapPin className="h-3.5 w-3.5" />
													{lead.city}
												</span>
											)}
											{lead.monthlyBill && <span>Bill: {formatCurrency(lead.monthlyBill)}/mo</span>}
										</div>
									</div>
									<div className="text-right text-sm text-gray-400">
										<div className="flex items-center gap-1">
											<Calendar className="h-3.5 w-3.5" />
											{formatDate(lead.createdAt)}
										</div>
										<div className="mt-0.5 text-xs capitalize">{lead.source}</div>
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
						<Link
							key={pageNumber}
							href={buildCrmHref({ page: pageNumber, status, search })}
							className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
								pageNumber === page ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"
							}`}
						>
							{pageNumber}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
