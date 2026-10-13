import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { LOAN_TERMS } from "@/lib/config";
import { aprRange, formatPct } from "@/lib/emi";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  ["Who can apply?", "Small traders and gig workers in Kerala aged 21 to 60, with at least 6 months of bank history and Rs 15,000 or more coming into their account each month."],
  ["How much can I borrow?", "Rs 15,000 to Rs 3,00,000. First loans go up to Rs 50,000, and your limit can grow after you repay on time."],
  ["Do I need a good credit score?", "Most loans go to people with a credit score above 700. A small number of loans go to people with no score or a lower score but strong, steady bank cash flow."],
  ["What does it cost?", `Interest of ${LOAN_TERMS.annualRatePct.min}% to ${LOAN_TERMS.annualRatePct.max}% a year, depending on your profile, plus a one-time processing fee of up to ${formatPct(LOAN_TERMS.processingFeeRate)} of the loan and GST on that fee. All-in, with the highest fee, that is an APR of about ${aprRange().min}% to ${aprRange().max}%, higher on shorter loans. These rates are indicative until our lending partner confirms them. You see the full cost and APR before you sign.`],
  ["How do I repay?", "In equal monthly EMIs over 6 to 60 months, auto-debited from the bank account you verify with us."],
  ["What if an EMI fails?", "A flat charge of Rs 250 applies for each failed auto-debit. We remind you before every EMI so you can keep money in your account."],
  ["Can I repay early?", "Yes. You can prepay from your account, and during the cooling-off period you can exit by repaying the principal and interest for the days used, with no penalty."],
  ["Is my data safe?", "Your bank data is shared only through the RBI Account Aggregator with your approval, stored in India, and never sold. We never access your contacts, photos or SMS."],
  ["Who lends the money?", "Our NBFC lending partner, registered with the RBI. Karmacash is its lending service provider and never holds your money."],
];

export default function Faq() {
  return (
    <PageShell title="Frequently asked questions">
      <div className="divide-y divide-line rounded-xl border border-line">
        {FAQS.map(([q, a]) => (
          <details key={q} className="group p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}
