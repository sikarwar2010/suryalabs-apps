"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { createLead } from "@/actions/crm.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { calculatePMSuryaGharSubsidy, formatCurrency } from "@/lib/utlis/helpers";
import { type CreateLeadInput, CreateLeadSchema } from "@/schema/crm.schema";

export default function NewLeadPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [subsidyPreview, setSubsidyPreview] = useState<number | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<z.input<typeof CreateLeadSchema>>({
		resolver: zodResolver(CreateLeadSchema),
		defaultValues: {
			state: "Rajasthan",
			source: "direct",
		},
	});

	const systemSizeKw = watch("systemSizeKw");

	// Live subsidy preview
	if (systemSizeKw && systemSizeKw > 0) {
		const { eligibleSubsidy } = calculatePMSuryaGharSubsidy(systemSizeKw);
		if (eligibleSubsidy !== subsidyPreview) setSubsidyPreview(eligibleSubsidy);
	}

	async function onSubmit(data: z.input<typeof CreateLeadSchema>) {
		setLoading(true);
		try {
			const result = await createLead(data as CreateLeadInput);
			if (result.success) {
				toast.success("Lead created successfully");
				router.push(`/dashboard/crm/leads/${result.lead.id}`);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Failed to create lead";
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	}
	return (
		<div className="max-w-7xl">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<Link href="/dashboard" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" prefetch={false}>
					<ArrowLeft className="h-5 w-5 text-gray-500" />
				</Link>
				<div>
					<h1 className="text-xl font-semibold text-gray-900 dark:text-white">New Lead Prospect</h1>
					<p className="text-sm text-gray-500">Capture a new solar installation prospect</p>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
				{/* Contact Info */}
				<div className="card p-6 space-y-4">
					<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Details</h2>
					<div className="grid grid-cols-2 gap-4">
						<div className="col-span-2">
							<Label className="mt-1">Full Name *</Label>
							<Input className="form-input" placeholder="Ramesh Kumar" {...register("name")} />
							{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
						</div>
						<div>
							<Label className="form-label">Mobile Number *</Label>
							<Input className="form-input" placeholder="9876543210" type="tel" {...register("phone")} />
							{errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
						</div>
						<div>
							<Label className="form-label">Email</Label>
							<Input className="form-input" placeholder="ramesh@email.com" type="email" {...register("email")} />
							{errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
						</div>
						<div>
							<Label className="">City</Label>
							<Input className="form-input" placeholder="Jaipur" {...register("city")} />
						</div>
						<div>
							<Label>State</Label>
							<NativeSelect className="form-select" {...register("state")}>
								{[
									"Rajasthan",
									"Gujarat",
									"Maharashtra",
									"Madhya Pradesh",
									"Uttar Pradesh",
									"Punjab",
									"Haryana",
									"Delhi",
									"Tamil Nadu",
									"Karnataka",
									"Telangana",
									"Andhra Pradesh",
									"Other",
								].map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</NativeSelect>
						</div>
						<div>
							<Label className="form-label">Pincode</Label>
							<Input className="form-input" placeholder="302001" maxLength={6} {...register("pincode")} />
							{errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode.message}</p>}
						</div>
						<div>
							<Label className="form-label">Lead Source</Label>
							<NativeSelect className="form-select" {...register("source")}>
								<option value="direct">Direct</option>
								<option value="referral">Referral</option>
								<option value="digital">Digital / Online</option>
								<option value="exhibition">Exhibition / Camp</option>
								<option value="govt_camp">Govt. Awareness Camp</option>
								<option value="other">Other</option>
							</NativeSelect>
						</div>
					</div>
				</div>

				{/* Solar Requirements */}
				<div className="card p-6 space-y-4">
					<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Solar Requirements</h2>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label className="form-label">Roof Type</Label>
							<NativeSelect className="form-select" {...register("roofType")}>
								<option value="">Select roof type</option>
								<option value="flat_rcc">Flat RCC</option>
								<option value="sloped_metal">Sloped — Metal Sheet</option>
								<option value="sloped_asbestos">Sloped — Asbestos</option>
								<option value="other">Other</option>
							</NativeSelect>
						</div>
						<div>
							<Label className="form-label">Roof Area (sq ft)</Label>
							<Input
								className="form-input"
								type="number"
								placeholder="500"
								{...register("roofArea", { valueAsNumber: true })}
							/>
						</div>
						<div>
							<Label className="form-label">System Size (kWp)</Label>
							<Input
								className="form-input"
								type="number"
								step="0.5"
								placeholder="3"
								{...register("systemSizeKw", { valueAsNumber: true })}
							/>
							{errors.systemSizeKw && <p className="mt-1 text-xs text-red-500">{errors.systemSizeKw.message}</p>}
						</div>
						<div>
							<Label className="form-label">Avg Monthly Electricity Bill (₹)</Label>
							<Input
								className="form-input"
								type="number"
								placeholder="3000"
								{...register("monthlyBill", { valueAsNumber: true })}
							/>
						</div>
					</div>

					{/* Subsidy preview */}
					{subsidyPreview !== null && subsidyPreview > 0 && (
						<div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-green-800">PM Surya Ghar Subsidy Estimate</p>
								<p className="text-xs text-green-600">For {systemSizeKw} kWp residential system</p>
							</div>
							<p className="text-lg font-bold text-green-700">{formatCurrency(subsidyPreview)}</p>
						</div>
					)}
				</div>
				{/* Notes */}
				<div className="card p-6 space-y-4">
					<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Notes</h2>
					<Textarea
						className="form-textarea"
						rows={3}
						placeholder="Any additional information about the prospect…"
						{...register("notes")}
					/>
				</div>
				{/* Actions */}
				<div className="flex items-center gap-3">
					<Button type="submit" disabled={loading} className="btn-primary px-6">
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" /> Saving…
							</>
						) : (
							<>
								<Save className="h-4 w-4" /> Create Lead
							</>
						)}
					</Button>
					<Link href="/dashboard/modules/crm" className="btn-secondary">
						Cancel
					</Link>
				</div>
			</form>
		</div>
	);
}
