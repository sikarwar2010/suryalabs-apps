import { ArrowLeft, Calendar, CheckCircle2, FileText, Home, Mail, MapPin, Phone, Zap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@/actions/crm.actions";
import { LeadStatusActions } from "@/components/crm/leadstatusactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requirePermission } from "@/lib/auth/rbac";
import { calculatePMSuryaGharSubsidy, formatCurrency, formatDate } from "@/lib/utlis/helpers";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
	new: "secondary",
	contacted: "default",
	survey_scheduled: "outline",
	survey_done: "outline",
	quotation_sent: "outline",
	negotiation: "secondary",
	won: "default",
	lost: "destructive",
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

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
	await requirePermission("crm:read");
	const { id } = await params;
	const lead = await getLeadById(id);
	if (!lead) notFound();

	const subsidyInfo = lead.systemSizeKw ? calculatePMSuryaGharSubsidy(Number(lead.systemSizeKw)) : null;

	return (
		<div className="container mx-auto max-w-6xl space-y-8 py-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild className="shrink-0">
						<Link href="/dashboard/crm">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<div className="min-w-0 flex-1">
						<div className="flex flex-col sm:flex-row sm:items-center gap-3">
							<h1 className="text-2xl font-semibold text-foreground truncate">{lead.name}</h1>
							<Badge variant={STATUS_VARIANTS[lead.status] ?? "secondary"}>
								{STATUS_LABELS[lead.status] ?? lead.status}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground mt-1">
							{lead.code} · Added {formatDate(lead.createdAt)}
						</p>
					</div>
				</div>
				<div className="flex gap-2 shrink-0">
					<Button asChild>
						<Link href={`/dashboard/sales/quotations/new?leadId=${lead.id}`}>
							<FileText className="h-4 w-4 mr-2" />
							Create Quotation
						</Link>
					</Button>
				</div>
			</div>

			{/* Pipeline Progress */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Sales Pipeline Progress</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="relative">
						<div className="flex items-center gap-1">
							{["new", "contacted", "survey_scheduled", "survey_done", "quotation_sent", "negotiation", "won"].map(
								(status, index, arr) => {
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
									const isCompleted = currentIdx > index;
									const isCurrent = currentIdx === index;

									return (
										<div key={status} className="flex items-center flex-1">
											<div className="relative flex-1">
												<div
													className={`h-2 rounded-full transition-all duration-300 ${
														isCompleted ? "bg-primary" : isCurrent ? "bg-primary/60" : "bg-muted"
													}`}
												/>
												{index === 0 && (
													<div
														className={`absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background transition-all duration-300 ${
															isCompleted || isCurrent ? "bg-primary" : "bg-muted"
														}`}
													/>
												)}
												{index === arr.length - 1 && (
													<div
														className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background transition-all duration-300 ${
															isCompleted || isCurrent ? "bg-primary" : "bg-muted"
														}`}
													>
														{(isCompleted || isCurrent) && (
															<CheckCircle2 className="w-3 h-3 text-primary-foreground absolute inset-0 m-auto" />
														)}
													</div>
												)}
											</div>
										</div>
									);
								},
							)}
						</div>
					</div>

					<div className="grid grid-cols-7 gap-2 text-center">
						{[
							{ label: "New", status: "new" },
							{ label: "Contacted", status: "contacted" },
							{ label: "Survey", status: "survey_scheduled" },
							{ label: "Done", status: "survey_done" },
							{ label: "Quotation", status: "quotation_sent" },
							{ label: "Negotiation", status: "negotiation" },
							{ label: "Won", status: "won" },
						].map((item, index) => {
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
							const isActive = currentIdx >= index;

							return (
								<div key={item.status} className="space-y-1">
									<span
										className={`text-xs font-medium transition-colors ${
											isActive ? "text-foreground" : "text-muted-foreground"
										}`}
									>
										{item.label}
									</span>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-6">
				{/* Contact Information */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Phone className="h-5 w-5" />
							Contact Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<InfoRow icon={Phone} label="Mobile" value={lead.phone} />
						<InfoRow icon={Mail} label="Email" value={lead.email ?? "—"} />
						<InfoRow
							icon={MapPin}
							label="Location"
							value={[lead.city, lead.state, lead.pincode].filter(Boolean).join(", ") || "—"}
						/>
						<InfoRow icon={Calendar} label="Source" value={lead.source ?? "Direct"} />
					</CardContent>
				</Card>

				{/* Solar Requirements */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-5 w-5" />
							Solar Requirements
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<InfoRow icon={Home} label="Roof Type" value={lead.roofType?.replace(/_/g, " ") ?? "—"} />
						<InfoRow icon={Home} label="Roof Area" value={lead.roofArea ? `${lead.roofArea} sq ft` : "—"} />
						<InfoRow icon={Zap} label="System Size" value={lead.systemSizeKw ? `${lead.systemSizeKw} kWp` : "—"} />
						<InfoRow
							icon={Zap}
							label="Monthly Bill"
							value={lead.monthlyBill ? formatCurrency(lead.monthlyBill) : "—"}
						/>
					</CardContent>
				</Card>

				{/* Subsidy Estimate */}
				{subsidyInfo && (
					<Card className="border-green-200 bg-green-50/50">
						<CardHeader>
							<CardTitle className="text-green-800 flex items-center gap-2">
								<Zap className="h-5 w-5" />
								PM Surya Ghar Subsidy Estimate
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{subsidyInfo.breakdown.map((item) => (
								<div key={item.label} className="flex justify-between items-center">
									<span className="text-sm text-green-700">{item.label}</span>
									<span className="font-medium text-green-800">{formatCurrency(item.amount)}</span>
								</div>
							))}
							<Separator className="bg-green-200" />
							<div className="flex justify-between items-center pt-2">
								<span className="font-semibold text-green-800">Total Subsidy</span>
								<Badge variant="default" className="bg-green-600 text-white">
									{formatCurrency(subsidyInfo.eligibleSubsidy)}
								</Badge>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Notes */}
				{lead.notes && (
					<Card className="xl:col-span-3 lg:col-span-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Notes
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Actions */}
			<LeadStatusActions lead={lead} />
		</div>
	);
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
	return (
		<div className="flex items-start gap-3">
			<div className="shrink-0">
				<Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-xs font-medium text-muted-foreground">{label}</p>
				<p className="text-sm text-foreground wrap-break-word">{value}</p>
			</div>
		</div>
	);
}
