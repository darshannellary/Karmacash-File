import type { Metadata } from "next";
import { EmiCalculator } from "@/components/EmiCalculator";
import { PageShell } from "@/components/PageShell";
import { LOAN_TERMS, SITE } from "@/lib/config";
import { formatInr, loanCost } from "@/lib/emi";

export const metadata: Metadata = { title: "Rates and charges" };

export default function Rates() {
  const sample = loanCost(50_000, LOAN_TERMS.annualRatePct.max, 6);
  const kfs: [string, string][] = [
    ["Lender", SITE.lendingPartner],
    ["Loan amount", formatInr(sample.principal)],
    ["Tenure", `${sample.months} monthly EMIs`],
    ["Interest rate", `${sample.annualRatePct}% a year, reducing balance`],
    ["Processing fee", `${formatInr(sample.processingFee)} (4% of the loan), charged by the lender`],
    ["GST on processing fee", formatInr(sample.gstOnFee)],
    ["Amount paid into your account", formatInr(sample.netDisbursal)],
    ["Monthly EMI", formatInr(sample.emi)],
    ["Total amount you repay", formatInr(sample.totalRepayable)],
    ["Annual percentage rate (APR)", `${sample.aprPct.toFixed(2)}%`],
    ["Failed EMI auto-debit", `${formatInr(LOAN_TERMS.failedEmiCharge)} per failed debit`],
    ["Prepayment", "Allowed"],
    ["Cooling-off period", "Exit by repaying principal and interest for the days used, with no penalty"],
    ["Grievance officer", SITE.grievanceOfficer.email],
  ];

  return (
    <PageShell
      title="Rates and charges"
      intro="Every rupee you pay is shown here and in your Key Fact Statement before you sign. Karmacash itself never charges you anything."
    >
      <table className="w-full text-left">
        <tbody className="divide-y divide-line">
          <Row label="Interest rate" value={`${LOAN_TERMS.annualRatePct.min}% to ${LOAN_TERMS.annualRatePct.max}% a year`} />
          <Row label="Processing fee" value="4% of the loan amount plus 18% GST, deducted at disbursal" />
          <Row label="Loan amount" value="Rs 15,000 to Rs 3,00,000" />
          <Row label="Repayment" value="Equal monthly EMIs over 6, 9 or 12 months, auto-debited" />
          <Row label="Failed EMI auto-debit" value={`${formatInr(LOAN_TERMS.failedEmiCharge)} flat`} />
          <Row label="Prepayment" value="Allowed" />
        </tbody>
      </table>

      <h2 className="mt-12 text-2xl font-bold">EMI calculator</h2>
      <div className="mt-4">
        <EmiCalculator />
      </div>

      <h2 className="mt-12 text-2xl font-bold">Sample Key Fact Statement</h2>
      <p className="mt-2 text-muted">For a Rs 50,000 loan over 6 months at the highest rate.</p>
      <table className="mt-4 w-full text-left text-sm">
        <tbody className="divide-y divide-line">
          {kfs.map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </tbody>
      </table>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th scope="row" className="py-3 pr-4 font-semibold">
        {label}
      </th>
      <td className="py-3 text-muted">{value}</td>
    </tr>
  );
}
