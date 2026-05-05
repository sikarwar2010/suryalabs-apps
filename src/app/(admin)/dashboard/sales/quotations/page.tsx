"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { createQuotation } from "@/actions/sales.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	calculatePMSuryaGharSubsidy,
	estimateAnnualGeneration,
	estimateMonthlyBillSavings,
	estimatePaybackYears,
	formatCurrency,
} from "@/lib/utlis/helpers";
import { type CreateQuotationInput, CreateQuotationSchema } from "@/schema/sales.schema";

const DEFAULT_ITEMS = [
	{
		description: "Solar PV Panel (440Wp Mono PERC)",
		unit: "pcs",
		gstRate: 12,
		hsnCode: "85414011",
	},
	{
		description: "On-Grid Solar Inverter",
		unit: "pcs",
		gstRate: 12,
		hsnCode: "85044090",
	},
	{
		description: "Mounting Structure (GI/Aluminium)",
		unit: "pcs",
		gstRate: 18,
		hsnCode: "73089090",
	},
	{
		description: "DC & AC Cables (BIS Certified)",
		unit: "lot",
		gstRate: 18,
		hsnCode: "85444290",
	},
	{
		description: "MCB / Protection Devices",
		unit: "set",
		gstRate: 18,
		hsnCode: "85362000",
	},
	{
		description: "Earthing & Lightning Arrestor",
		unit: "set",
		gstRate: 18,
		hsnCode: "85437090",
	},
	{
		description: "Commissioning & Installation Charges",
		unit: "job",
		gstRate: 18,
		hsnCode: "995466",
	},
	{
		description: "Net Meter Application Assistance",
		unit: "job",
		gstRate: 18,
		hsnCode: "998319",
	},
];

export default function NewQuotationPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const leadId = searchParams.get("leadId");
	const [loading, setLoading] = useState(false);
	const [totals, setTotals] = useState({
		subtotal: 0,
		gst: 0,
		gross: 0,
		subsidy: 0,
		net: 0,
	});

	const {
		register,
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<z.input<typeof CreateQuotationSchema>>({
		resolver: zodResolver(CreateQuotationSchema),
		defaultValues: {
			systemSizeKw: 3,
			panelWatts: 440,
			panelQuantity: 7,
			inverterKw: 3,
			lineItems: DEFAULT_ITEMS.map((item) => ({
				description: item.description,
				quantity: 1,
				unit: item.unit,
				unitPrice: 0,
				gstRate: item.gstRate,
				hsnCode: item.hsnCode,
				amount: 0,
				gstAmount: 0,
				total: 0,
			})),
			subsidyAmount: 0,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "lineItems",
	});
	const watchedItems = watch("lineItems");
	const systemSizeKw = watch("systemSizeKw");

	// Recalculate totals
	const recalculate = useCallback(() => {
		let subtotal = 0,
			gstTotal = 0;
		watchedItems.forEach((item) => {
			const amount = (item.quantity || 0) * (item.unitPrice || 0);
			const gstAmt = amount * ((item.gstRate || 0) / 100);
			subtotal += amount;
			gstTotal += gstAmt;
		});
		const gross = subtotal + gstTotal;
		const subsidy = systemSizeKw ? calculatePMSuryaGharSubsidy(systemSizeKw).eligibleSubsidy : 0;
		const net = Math.max(0, gross - subsidy);

		setTotals({ subtotal, gst: gstTotal, gross, subsidy, net });
		setValue("subtotal", subtotal);
		setValue("gstAmount", gstTotal);
		setValue("totalAmount", gross);
		setValue("subsidyAmount", subsidy);
		setValue("netAmount", net);
	}, [watchedItems, systemSizeKw, setValue]);

	useEffect(() => {
		recalculate();
	}, [recalculate]);

	// Auto-calc panel qty
	const panelWatts = watch("panelWatts");
	useEffect(() => {
		if (systemSizeKw && panelWatts) {
			const qty = Math.ceil((systemSizeKw * 1000) / panelWatts);
			setValue("panelQuantity", qty);
		}
	}, [systemSizeKw, panelWatts, setValue]);

	// Update line item totals on quantity/price change
	function updateLineItem(index: number) {
		const item = watchedItems[index];
		if (!item) return;
		const amount = (item.quantity || 0) * (item.unitPrice || 0);
		const gstAmt = amount * ((item.gstRate || 0) / 100);
		setValue(`lineItems.${index}.amount`, amount);
		setValue(`lineItems.${index}.gstAmount`, gstAmt);
		setValue(`lineItems.${index}.total`, amount + gstAmt);
	}

	async function onSubmit(data: z.input<typeof CreateQuotationSchema>) {
		setLoading(true);
		try {
			const result = await createQuotation({
				...data,
				leadId: leadId ?? undefined,
			} as CreateQuotationInput);
			if (result.success) {
				toast.success("Quotation created!");
				router.push(`/dashboard/sales/quotations/${result.quotation.id}`);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to create quotation";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}

	const annualGen = systemSizeKw ? estimateAnnualGeneration(systemSizeKw) : 0;
	const monthlySaving = estimateMonthlyBillSavings(annualGen);
	const payback = totals.net > 0 ? estimatePaybackYears(totals.net, monthlySaving * 12) : 0;

	return (
		<div className="max-w-4xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/dashboard/sales/quotations">
						<ArrowLeft />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-semibold">New Quotation</h1>
					<p className="text-sm text-muted-foreground">Configure solar system and generate quotation</p>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* System Config */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm uppercase tracking-wide">System Configuration</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="space-y-1.5">
								<Label>System Size (kWp) *</Label>
								<Input type="number" step="0.5" {...register("systemSizeKw", { valueAsNumber: true })} />
								{errors.systemSizeKw && <p className="text-xs text-destructive">{errors.systemSizeKw.message}</p>}
							</div>
							<div className="space-y-1.5">
								<Label>Panel Watts (Wp)</Label>
								<NativeSelect {...register("panelWatts", { valueAsNumber: true })}>
									{[380, 400, 415, 430, 440, 450, 480, 530, 545].map((w) => (
										<option key={w} value={w}>
											{w} Wp
										</option>
									))}
								</NativeSelect>
							</div>
							<div className="space-y-1.5">
								<Label>No. of Panels</Label>
								<Input
									type="number"
									readOnly
									className="bg-muted"
									{...register("panelQuantity", { valueAsNumber: true })}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>Inverter (kW)</Label>
								<Input type="number" step="0.5" {...register("inverterKw", { valueAsNumber: true })} />
							</div>
						</div>

						{/* Quick estimates */}
						{systemSizeKw > 0 && (
							<div className="mt-4 grid grid-cols-3 gap-3">
								<div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center dark:bg-orange-950/30">
									<p className="text-xs text-orange-600">Annual Generation</p>
									<p className="text-lg font-semibold text-orange-800 dark:text-orange-300">
										{annualGen.toLocaleString("en-IN")} kWh
									</p>
								</div>
								<div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:bg-green-950/30">
									<p className="text-xs text-green-600">Monthly Saving</p>
									<p className="text-lg font-semibold text-green-800 dark:text-green-300">
										{formatCurrency(monthlySaving)}
									</p>
								</div>
								<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center dark:bg-blue-950/30">
									<p className="text-xs text-blue-600">Payback Period</p>
									<p className="text-lg font-semibold text-blue-800 dark:text-blue-300">{payback} yrs</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Line Items */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm uppercase tracking-wide">Bill of Materials</CardTitle>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								append({
									description: "",
									quantity: 1,
									unit: "pcs",
									unitPrice: 0,
									gstRate: 18,
									amount: 0,
									gstAmount: 0,
									total: 0,
								})
							}
						>
							<Plus className="size-3.5" />
							Add Item
						</Button>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[40%]">Description</TableHead>
									<TableHead className="w-[8%] text-right">Qty</TableHead>
									<TableHead className="w-[8%]">Unit</TableHead>
									<TableHead className="w-[14%] text-right">Rate (₹)</TableHead>
									<TableHead className="w-[8%] text-right">GST%</TableHead>
									<TableHead className="w-[14%] text-right">Total (₹)</TableHead>
									<TableHead className="w-[6%]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{fields.map((field, index) => (
									<TableRow key={field.id}>
										<TableCell>
											<Input
												className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1"
												placeholder="Item description"
												{...register(`lineItems.${index}.description`)}
											/>
										</TableCell>
										<TableCell>
											<Input
												className="h-7 border-0 bg-transparent text-right shadow-none focus-visible:ring-1"
												type="number"
												{...register(`lineItems.${index}.quantity`, {
													valueAsNumber: true,
													onChange: () => updateLineItem(index),
												})}
											/>
										</TableCell>
										<TableCell>
											<Input
												className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1"
												{...register(`lineItems.${index}.unit`)}
											/>
										</TableCell>
										<TableCell>
											<Input
												className="h-7 border-0 bg-transparent text-right shadow-none focus-visible:ring-1"
												type="number"
												{...register(`lineItems.${index}.unitPrice`, {
													valueAsNumber: true,
													onChange: () => updateLineItem(index),
												})}
											/>
										</TableCell>
										<TableCell>
											<NativeSelect
												className="h-7 border-0 bg-transparent text-right [&>select]:pr-6 [&>select]:pl-1 [&>select]:text-right"
												{...register(`lineItems.${index}.gstRate`, {
													valueAsNumber: true,
													onChange: () => updateLineItem(index),
												})}
											>
												{[0, 5, 12, 18, 28].map((r) => (
													<option key={r} value={r}>
														{r}%
													</option>
												))}
											</NativeSelect>
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(watchedItems[index]?.total ?? 0)}
										</TableCell>
										<TableCell>
											<Button
												type="button"
												variant="ghost"
												size="icon-xs"
												onClick={() => remove(index)}
												className="text-muted-foreground hover:text-destructive"
											>
												<Trash2 />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* Totals + Subsidy */}
				<div className="grid md:grid-cols-2 gap-6">
					{/* Subsidy breakdown */}
					{systemSizeKw > 0 && (
						<Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
							<CardHeader>
								<CardTitle className="text-sm text-green-800 dark:text-green-300">
									PM Surya Ghar Subsidy Breakdown
								</CardTitle>
							</CardHeader>
							<CardContent>
								{calculatePMSuryaGharSubsidy(systemSizeKw).breakdown.map((b) => (
									<div key={b.label} className="flex justify-between text-sm mb-1.5">
										<span className="text-green-700 dark:text-green-400">{b.label}</span>
										<span className="font-medium text-green-800 dark:text-green-300">{formatCurrency(b.amount)}</span>
									</div>
								))}
								<Separator className="my-2 bg-green-200" />
								<div className="flex justify-between">
									<span className="font-semibold text-green-800 dark:text-green-300">Total Subsidy</span>
									<span className="font-bold text-green-700 dark:text-green-300 text-lg">
										{formatCurrency(totals.subsidy)}
									</span>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Invoice summary */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Price Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Subtotal</span>
									<span>{formatCurrency(totals.subtotal)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">GST</span>
									<span>{formatCurrency(totals.gst)}</span>
								</div>
								<Separator />
								<div className="flex justify-between font-medium pt-1">
									<span>Gross Total</span>
									<span>{formatCurrency(totals.gross)}</span>
								</div>
								<div className="flex justify-between text-green-600">
									<span>PM Surya Ghar Subsidy</span>
									<span>-{formatCurrency(totals.subsidy)}</span>
								</div>
								<Separator />
								<div className="flex justify-between font-bold text-base pt-1">
									<span>Net Payable</span>
									<span className="text-orange-600">{formatCurrency(totals.net)}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Validity and notes */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm uppercase tracking-wide">Additional Details</CardTitle>
					</CardHeader>
					<CardContent className="grid md:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Valid Until</Label>
							<Input type="date" min={new Date().toISOString().split("T")[0]} {...register("validUntil")} />
						</div>
						<div className="md:col-span-2 space-y-1.5">
							<Label>Notes</Label>
							<Textarea rows={2} placeholder="Additional notes for the customer…" {...register("notes")} />
						</div>
					</CardContent>
				</Card>

				{/* Submit */}
				<div className="flex gap-3">
					<Button type="submit" disabled={loading}>
						{loading ? (
							<>
								<Loader2 className="animate-spin" /> Saving…
							</>
						) : (
							"Create Quotation"
						)}
					</Button>
					<Button variant="outline" asChild>
						<Link href="/dashboard/sales">Cancel</Link>
					</Button>
				</div>
			</form>
		</div>
	);
}
