"use client";

import { pdf } from "@react-pdf/renderer";
import { Download, Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { QuotationPDF } from "@/components/sales/Quotationpdf";
import { Button } from "../ui/button";

const COMPANY = {
	name: "Vaishnavi Enterprises",
	address: "42, Solar Market, Agra - 282010, Uttar Pradesh",
	phone: "+91-141-4567890",
	email: "info@sunrisesolar.in",
	gstin: "08AAAAA0000A1Z5",
};

export function QuotationPDFDownload({
	quotation,
	subsidyBreakdown,
}: {
	quotation: {
		code: string;
		createdAt: Date;
		validUntil?: string | null;
		systemSizeKw: string;
		lineItems: {
			description: string;
			quantity: number;
			unit: string;
			unitPrice: number;
			gstRate: number;
			amount: number;
			gstAmount: number;
			total: number;
			hsnCode?: string;
		}[];
		subtotal: string;
		gstAmount: string;
		totalAmount: string;
		subsidyAmount: string | null;
		netAmount: string;
		terms?: string | null;
		notes?: string | null;
	};
	subsidyBreakdown: { label: string; amount: number }[];
}) {
	const [generating, setGenerating] = useState(false);

	async function downloadPDF() {
		setGenerating(true);
		try {
			const customer = {
				name: "Customer Name",
				phone: "9876543210",
				city: "Jaipur",
				state: "Rajasthan",
			};

			const blob = await pdf(
				<QuotationPDF
					quotation={quotation}
					customer={customer}
					company={COMPANY}
					subsidyBreakdown={subsidyBreakdown}
				/>,
			).toBlob();

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${quotation.code}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success("Quotation PDF downloaded");
		} catch {
			toast.error("Failed to generate PDF");
		} finally {
			setGenerating(false);
		}
	}

	return (
		<Button onClick={downloadPDF} disabled={generating} className="btn-secondary text-sm">
			{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
			{generating ? "Generating…" : "Download PDF"}
		</Button>
	);
}

export function ConvertToOrderButton({ quotationId }: { quotationId: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function convert() {
		setLoading(true);
		try {
			router.push(`/dashboard/sales/orders/new?quotationId=${quotationId}`);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Button onClick={convert} disabled={loading} className="btn-primary text-sm">
			<ShoppingCart className="h-4 w-4" />
			Convert to Order
		</Button>
	);
}
