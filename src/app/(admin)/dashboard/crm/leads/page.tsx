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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  calculatePMSuryaGharSubsidy,
  formatCurrency,
} from "@/lib/utlis/helpers";
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
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create lead";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          prefetch={false}
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            New Lead Prospect
          </h1>
          <p className="text-sm text-gray-500">
            Capture a new solar installation prospect
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        autoComplete="off"
      >
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Full Name *</FieldLabel>
                <Input placeholder="Ramesh Kumar" {...register("name")} />
                <FieldError errors={[errors.name]} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Mobile Number *</FieldLabel>
                  <Input
                    placeholder="9876543210"
                    type="tel"
                    {...register("phone")}
                  />
                  <FieldError errors={[errors.phone]} />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    placeholder="ramesh@email.com"
                    type="email"
                    {...register("email")}
                  />
                  <FieldError errors={[errors.email]} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>City</FieldLabel>
                  <Input placeholder="Jaipur" {...register("city")} />
                </Field>
                <Field>
                  <FieldLabel>State</FieldLabel>
                  <NativeSelect {...register("state")}>
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
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Pincode</FieldLabel>
                  <Input
                    placeholder="302001"
                    maxLength={6}
                    {...register("pincode")}
                  />
                  <FieldError errors={[errors.pincode]} />
                </Field>
                <Field>
                  <FieldLabel>Lead Source</FieldLabel>
                  <NativeSelect {...register("source")}>
                    <option value="direct">Direct</option>
                    <option value="referral">Referral</option>
                    <option value="digital">Digital / Online</option>
                    <option value="exhibition">Exhibition / Camp</option>
                    <option value="govt_camp">Govt. Awareness Camp</option>
                    <option value="other">Other</option>
                  </NativeSelect>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Solar Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Solar Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Roof Type</FieldLabel>
                  <NativeSelect {...register("roofType")}>
                    <option value="">Select roof type</option>
                    <option value="flat_rcc">Flat RCC</option>
                    <option value="sloped_metal">Sloped — Metal Sheet</option>
                    <option value="sloped_asbestos">Sloped — Asbestos</option>
                    <option value="other">Other</option>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel>Roof Area (sq ft)</FieldLabel>
                  <Input
                    type="number"
                    placeholder="500"
                    {...register("roofArea", { valueAsNumber: true })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>System Size (kWp)</FieldLabel>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="3"
                    {...register("systemSizeKw", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.systemSizeKw]} />
                </Field>
                <Field>
                  <FieldLabel>Avg Monthly Electricity Bill (₹)</FieldLabel>
                  <Input
                    type="number"
                    placeholder="3000"
                    {...register("monthlyBill", { valueAsNumber: true })}
                  />
                </Field>
              </div>
            </FieldGroup>

            {/* Subsidy preview */}
            {subsidyPreview !== null && subsidyPreview > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    PM Surya Ghar Subsidy Estimate
                  </p>
                  <p className="text-xs text-green-600">
                    For {systemSizeKw} kWp residential system
                  </p>
                </div>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(subsidyPreview)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Field>
              <Textarea
                rows={3}
                placeholder="Any additional information about the prospect…"
                {...register("notes")}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
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
          <Button variant="outline" asChild>
            <Link href="/dashboard/modules/crm">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
