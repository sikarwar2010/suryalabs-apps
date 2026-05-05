import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utlis/helpers";

// Types
interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  amount: number;
  gstAmount: number;
  total: number;
  hsnCode?: string;
}

interface QuotationPDFProps {
  quotation: {
    code: string;
    createdAt: Date;
    validUntil?: string | null;
    systemSizeKw: string;
    lineItems: LineItem[];
    subtotal: string;
    gstAmount: string;
    totalAmount: string;
    subsidyAmount: string | null;
    netAmount: string;
    terms?: string | null;
    notes?: string | null;
  };
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    state?: string | null;
    addressLine1?: string | null;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    logo?: string;
  };
  subsidyBreakdown?: { label: string; amount: number }[];
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#f97316",
    paddingBottom: 12,
  },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#f97316" },
  companyDetails: { fontSize: 9, color: "#555", marginTop: 4, lineHeight: 1.4 },
  quotationTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#1a1a1a",
  },
  quotationMeta: {
    fontSize: 9,
    color: "#555",
    textAlign: "right",
    marginTop: 4,
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#f97316",
    marginBottom: 6,
    marginTop: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#fed7aa",
    paddingBottom: 3,
  },
  customerRow: { flexDirection: "row", gap: 6, marginBottom: 3 },
  customerLabel: { fontSize: 9, color: "#888", width: 60 },
  customerValue: { fontSize: 9, color: "#1a1a1a", flex: 1 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  tableHeaderText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#fff" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  tableRowAlt: { backgroundColor: "#fff7ed" },
  colDesc: { flex: 3 },
  colHsn: { flex: 1, textAlign: "center" },
  colQty: { flex: 0.7, textAlign: "right" },
  colUnit: { flex: 0.6, textAlign: "center" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colGst: { flex: 0.7, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  totalSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  totalBox: {
    width: 220,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  totalLabel: { fontSize: 9, color: "#555" },
  totalValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#f97316",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
  },
  subsidyHighlight: {
    backgroundColor: "#dcfce7",
    borderWidth: 0.5,
    borderColor: "#86efac",
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  subsidyTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
    marginBottom: 4,
  },
  subsidyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  subsidyLabel: { fontSize: 9, color: "#166534" },
  subsidyValue: { fontSize: 9, color: "#166534" },
  termsSection: { marginTop: 20 },
  termsText: { fontSize: 8.5, color: "#555", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#9ca3af" },
  badge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 8, color: "#166534", fontFamily: "Helvetica-Bold" },
});

export function QuotationPDF({
  quotation,
  customer,
  company,
  subsidyBreakdown,
}: QuotationPDFProps) {
  const lineItems = quotation.lineItems as LineItem[];

  return (
    <Document title={`Quotation ${quotation.code}`} author={company.name}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyDetails}>{company.address}</Text>
            <Text style={styles.companyDetails}>
              📞 {company.phone} | ✉ {company.email}
            </Text>
            <Text style={styles.companyDetails}>GSTIN: {company.gstin}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                PM Surya Ghar Yojana Registered Vendor
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.quotationTitle}>QUOTATION</Text>
            <Text style={styles.quotationMeta}>No: {quotation.code}</Text>
            <Text style={styles.quotationMeta}>
              Date: {formatDate(quotation.createdAt)}
            </Text>
            {quotation.validUntil && (
              <Text style={styles.quotationMeta}>
                Valid Until: {formatDate(quotation.validUntil)}
              </Text>
            )}
            <Text style={styles.quotationMeta}>
              System Size: {quotation.systemSizeKw} kWp
            </Text>
          </View>
        </View>

        {/* Customer */}
        <Text style={styles.sectionTitle}>Bill To</Text>
        <View style={styles.customerRow}>
          <Text style={styles.customerLabel}>Name</Text>
          <Text style={styles.customerValue}>{customer.name}</Text>
        </View>
        {customer.addressLine1 && (
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>Address</Text>
            <Text style={styles.customerValue}>
              {customer.addressLine1}, {customer.city}, {customer.state}
            </Text>
          </View>
        )}
        {customer.phone && (
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>Phone</Text>
            <Text style={styles.customerValue}>{customer.phone}</Text>
          </View>
        )}
        {customer.email && (
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>Email</Text>
            <Text style={styles.customerValue}>{customer.email}</Text>
          </View>
        )}

        {/* Line Items */}
        <Text style={styles.sectionTitle}>System Components & Services</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            Description
          </Text>
          <Text style={[styles.tableHeaderText, styles.colHsn]}>HSN</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>
            Rate (₹)
          </Text>
          <Text style={[styles.tableHeaderText, styles.colGst]}>GST%</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>
            Total (₹)
          </Text>
        </View>
        {lineItems.map((item, i) => (
          <View
            key={`${item.description}-${item.unitPrice}-${item.quantity}`}
            style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
          >
            <Text style={[{ fontSize: 9 }, styles.colDesc]}>
              {item.description}
            </Text>
            <Text style={[{ fontSize: 9 }, styles.colHsn]}>
              {item.hsnCode ?? "—"}
            </Text>
            <Text style={[{ fontSize: 9 }, styles.colQty]}>
              {item.quantity}
            </Text>
            <Text style={[{ fontSize: 9 }, styles.colUnit]}>{item.unit}</Text>
            <Text style={[{ fontSize: 9 }, styles.colPrice]}>
              {formatCurrency(item.unitPrice)}
            </Text>
            <Text style={[{ fontSize: 9 }, styles.colGst]}>
              {item.gstRate}%
            </Text>
            <Text style={[{ fontSize: 9 }, styles.colTotal]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quotation.subtotal)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (CGST + SGST)</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quotation.gstAmount)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quotation.totalAmount)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: "#166534" }]}>
                PM Surya Ghar Subsidy
              </Text>
              <Text style={[styles.totalValue, { color: "#166534" }]}>
                -{formatCurrency(quotation.subsidyAmount ?? "0")}
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Net Payable</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(quotation.netAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Subsidy Breakdown */}
        {subsidyBreakdown && subsidyBreakdown.length > 0 && (
          <View style={styles.subsidyHighlight}>
            <Text style={styles.subsidyTitle}>
              PM Surya Ghar Muft Bijli Yojana — Subsidy Breakdown
            </Text>
            {subsidyBreakdown.map((item) => (
              <View key={item.label} style={styles.subsidyRow}>
                <Text style={styles.subsidyLabel}>{item.label}</Text>
                <Text style={styles.subsidyValue}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {quotation.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={[styles.termsText]}>{quotation.notes}</Text>
          </>
        )}

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            {quotation.terms ??
              `1. This quotation is valid for 30 days from the date of issue.\n` +
                `2. 50% advance payment required to confirm order. Balance before dispatch.\n` +
                `3. Installation includes earthing, cable, mounting structure as per site.\n` +
                `4. Net metering application assistance included.\n` +
                `5. Subsidy amount will be directly credited to customer's bank account by DISCOM.\n` +
                `6. Warranty: 25-year performance warranty on panels, 5 years on inverter, 1 year workmanship.\n` +
                `7. Prices are subject to change in case of significant market fluctuation.`}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {company.name} | GSTIN: {company.gstin}
          </Text>
          <Text style={styles.footerText}>
            This is a computer-generated quotation. | {quotation.code}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
