import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuotationById } from "@/actions/sales.actions";
import { ConvertToOrderButton, QuotationPDFDownload } from "@/components/sales/Quotationpdfdownload";
import { requirePermission } from "@/lib/auth/rbac";
import { calculatePMSuryaGharSubsidy, formatCurrency, formatDate } from "@/lib/utlis/helpers";

export default async function QuotationDetailPage({ params }: { params: { id: string } }) {
	await requirePermission("sales:read");
	const { id } =  await params;
	const quotation = await getQuotationById(id);
	if (!quotation) notFound();

	const lineItems = quotation.lineItems;
	const subsidyBreakdown = quotation.systemSizeKw
		? calculatePMSuryaGharSubsidy(Number(quotation.systemSizeKw)).breakdown
		: [];

	const STATUS_COLOR: Record<string, string> = {
		draft: "bg-gray-100 text-gray-600",
		approved: "bg-green-100 text-green-700",
		converted: "bg-blue-100 text-blue-700",
		expired: "bg-red-100 text-red-600",
	};

	return (
		<div className="max-w-4xl space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					<Link href="/dashboard/modules/sales/quotations" className="p-1.5 hover:bg-gray-100 rounded-lg">
						<ArrowLeft className="h-5 w-5 text-gray-500" />
					</Link>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-xl font-semibold text-gray-900">{quotation.code}</h1>
							<span className={`status-badge ${STATUS_COLOR[quotation.status] ?? "bg-gray-100 text-gray-600"}`}>
								{quotation.status}
							</span>
						</div>
						<p className="text-sm text-gray-500 mt-0.5">
							{quotation.systemSizeKw} kWp · Created {formatDate(quotation.createdAt)}
							{quotation.validUntil && ` · Valid until ${formatDate(quotation.validUntil)}`}
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<QuotationPDFDownload quotation={quotation} subsidyBreakdown={subsidyBreakdown} />
					{quotation.status !== "converted" && <ConvertToOrderButton quotationId={quotation.id} />}
				</div>
			</div>

			{/* System summary */}
			<div className="grid grid-cols-3 gap-4">
				<div className="card p-4 text-center">
					<p className="text-xs text-gray-500">System Size</p>
					<p className="text-2xl font-bold text-orange-600 mt-1">{quotation.systemSizeKw} kWp</p>
				</div>
				<div className="card p-4 text-center">
					<p className="text-xs text-gray-500">Gross Total</p>
					<p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(quotation.totalAmount)}</p>
				</div>
				<div className="card p-4 text-center bg-green-50 border-green-100">
					<p className="text-xs text-green-600">Net After Subsidy</p>
					<p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(quotation.netAmount)}</p>
				</div>
			</div>

			{/* Line Items */}
			<div className="table-container">
				<div className="px-4 py-3 border-b border-gray-100">
					<h2 className="text-sm font-semibold text-gray-700">Bill of Materials</h2>
				</div>
				<table className="data-table">
					<thead>
						<tr>
							<th>Description</th>
							<th className="text-center">HSN</th>
							<th className="text-right">Qty</th>
							<th className="text-right">Rate</th>
							<th className="text-right">GST</th>
							<th className="text-right">Total</th>
						</tr>
					</thead>
					<tbody>
						{lineItems.map((item) => (
							<tr key={item.itemId ?? item.description}>
								<td className="font-medium">{item.description}</td>
								<td className="text-center text-gray-400">{item.hsnCode ?? "—"}</td>
								<td className="text-right">
									{item.quantity} {item.unit}
								</td>
								<td className="text-right">{formatCurrency(item.unitPrice)}</td>
								<td className="text-right text-gray-500">{item.gstRate}%</td>
								<td className="text-right font-medium">{formatCurrency(item.total)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Totals */}
			<div className="flex justify-end">
				<div className="w-72 card p-5 space-y-2.5 text-sm">
					<div className="flex justify-between text-gray-600">
						<span>Subtotal</span>
						<span>{formatCurrency(quotation.subtotal)}</span>
					</div>
					<div className="flex justify-between text-gray-600">
						<span>GST Amount</span>
						<span>{formatCurrency(quotation.gstAmount)}</span>
					</div>
					<div className="flex justify-between font-medium border-t border-gray-100 pt-2.5">
						<span>Gross Total</span>
						<span>{formatCurrency(quotation.totalAmount)}</span>
					</div>
					<div className="flex justify-between text-green-600">
						<span>PM Surya Ghar Subsidy</span>
						<span>-{formatCurrency(quotation.subsidyAmount ?? 0)}</span>
					</div>
					<div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2.5">
						<span>Net Payable</span>
						<span className="text-orange-600">{formatCurrency(quotation.netAmount)}</span>
					</div>
				</div>
			</div>

			{/* Subsidy breakdown */}
			{subsidyBreakdown.length > 0 && (
				<div className="card p-5 bg-green-50 border-green-100">
					<div className="flex items-center gap-2 mb-3">
						<CheckCircle className="h-4 w-4 text-green-600" />
						<h3 className="text-sm font-semibold text-green-800">
							PM Surya Ghar Muft Bijli Yojana — Subsidy Breakdown
						</h3>
					</div>
					<div className="space-y-1.5">
						{subsidyBreakdown.map((b) => (
							<div key={b.label} className="flex justify-between text-sm">
								<span className="text-green-700">{b.label}</span>
								<span className="font-medium text-green-800">{formatCurrency(b.amount)}</span>
							</div>
						))}
					</div>
					<p className="text-xs text-green-600 mt-3">
						* Subsidy is credited directly to the customer's bank account by DISCOM after net metering.
					</p>
				</div>
			)}

			{quotation.notes && (
				<div className="card p-5">
					<h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
					<p className="text-sm text-gray-600">{quotation.notes}</p>
				</div>
			)}
		</div>
	);
}
