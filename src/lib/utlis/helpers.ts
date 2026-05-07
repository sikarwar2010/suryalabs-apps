import { format } from "date-fns";

// ─── Code generators ─────────────────────────────────────────────────────────

export function generateCode(prefix: string, _length = 6): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

export function generateLeadCode(): string { return generateCode("LEAD"); }
export function generateQuotationCode(): string { return generateCode("QUO"); }
export function generateSalesOrderCode(): string { return generateCode("SO"); }
export function generatePOCode(): string { return generateCode("PO"); }
export function generateGRNCode(): string { return generateCode("GRN"); }
export function generateInvoiceCode(): string { return generateCode("INV"); }
export function generateSubsidyCode(): string { return generateCode("SUB"); }
export function generateDeliveryCode(): string { return generateCode("DEL"); }
export function generateInstallationCode(): string { return generateCode("INST"); }
export function generateVoucherCode(): string { return generateCode("VCH"); }
export function generatePaymentCode(): string { return generateCode("PAY"); }
export function generateCustomerCode(): string { return generateCode("CUST"); }
export function generateVendorCode(): string { return generateCode("VEND"); }
export function generateItemCode(): string { return generateCode("ITEM"); }
export function generateWarehouseCode(): string { return generateCode("WH"); }
export function generateEmployeeCode(): string { return generateCode("EMP"); }
export function generateRFQCode(): string { return generateCode("RFQ"); }

// ─── PM Surya Ghar Subsidy Calculator ────────────────────────────────────────
// Rules as per scheme guidelines (valid for residential category)
// Up to 1 kW: ₹30,000
// 1-2 kW: ₹18,000 per additional kW
// Above 2 kW: ₹9,000 per additional kW, capped at 3 kW (₹78,000 max)

export interface SubsidyCalculation {
  systemSizeKw: number;
  eligibleSubsidy: number;
  category: string;
  breakdown: { label: string; amount: number }[];
}

export function calculatePMSuryaGharSubsidy(systemSizeKw: number, category = "residential"): SubsidyCalculation {
  if (category !== "residential") {
    return {
      systemSizeKw, eligibleSubsidy: 0, category,
      breakdown: [{ label: "Non-residential: no central subsidy", amount: 0 }],
    };
  }

  const kw = Math.min(systemSizeKw, 10); // max considered 10 kW
  const breakdown: { label: string; amount: number }[] = [];
  let total = 0;

  if (kw >= 1) {
    breakdown.push({ label: "First 1 kW @ ₹30,000", amount: 30000 });
    total += 30000;
  }
  if (kw > 1) {
    const extra1 = Math.min(kw - 1, 1); // second kW
    const amt1 = Math.round(extra1 * 18000);
    breakdown.push({ label: `Next ${extra1.toFixed(2)} kW @ ₹18,000/kW`, amount: amt1 });
    total += amt1;
  }
  if (kw > 2) {
    const extra2 = Math.min(kw - 2, 1); // third kW, capped
    const amt2 = Math.round(extra2 * 9000);
    breakdown.push({ label: `Next ${extra2.toFixed(2)} kW @ ₹9,000/kW`, amount: amt2 });
    total += amt2;
  }

  // Max subsidy is ₹78,000
  const capped = Math.min(total, 78000);
  if (capped < total) {
    breakdown.push({ label: "Capped at scheme maximum", amount: -(total - capped) });
  }

  return { systemSizeKw: kw, eligibleSubsidy: capped, category: "residential", breakdown };
}

// ─── GST Calculator ───────────────────────────────────────────────────────────

export interface GSTBreakdown {
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  type: "cgst_sgst" | "igst";
}

export function calculateGST(
  subtotal: number,
  gstRate: number,
  type: "cgst_sgst" | "igst" = "cgst_sgst"
): GSTBreakdown {
  const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
  return {
    subtotal,
    gstRate,
    gstAmount,
    cgst: type === "cgst_sgst" ? gstAmount / 2 : 0,
    sgst: type === "cgst_sgst" ? gstAmount / 2 : 0,
    igst: type === "igst" ? gstAmount : 0,
    total: subtotal + gstAmount,
    type,
  };
}

// ─── Number formatting ────────────────────────────────────────────────────────

export function formatCurrency(amount: number | string, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatNumber(n: number | string): string {
  return new Intl.NumberFormat("en-IN").format(Number(n));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

// ─── System sizing helpers ────────────────────────────────────────────────────

export function calculatePanelCount(systemKw: number, panelWatts: number): number {
  return Math.ceil((systemKw * 1000) / panelWatts);
}

export function estimateAnnualGeneration(systemKw: number, sunHours = 5.5): number {
  // Standard formula: kW × sun hours/day × 365 × 0.8 (efficiency)
  return Math.round(systemKw * sunHours * 365 * 0.8);
}

export function estimateMonthlyBillSavings(annualGeneration: number, tariff = 7.5): number {
  return Math.round((annualGeneration * tariff) / 12);
}

export function estimatePaybackYears(netCost: number, annualSavings: number): number {
  return parseFloat((netCost / annualSavings).toFixed(1));
}
