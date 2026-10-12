import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exitDuringCoolingOff, signOut, withdrawAaConsent } from "@/app/apply/actions";
import { dueDates, formatDate } from "@/lib/application";
import { COOLING_OFF_DAYS, SANDBOX, SITE } from "@/lib/config";
import { formatInr, loanCost, schedule } from "@/lib/emi";
import { readState } from "@/lib/session";

export const metadata: Metadata = { title: "Your loan", robots: { index: false } };

export default function Account() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading your loan…</p>}>
        <LoanView />
      </Suspense>
    </div>
  );
}

async function LoanView() {
  const s = await readState();
  if (!s.loan || !s.offer || !s.account || !s.mandate) {
    return (
      <>
        <h1 className="text-2xl font-bold">You don&apos;t have a loan yet</h1>
        <p className="mt-2 text-muted">
          <Link href="/apply" className="font-semibold text-action underline">
            Continue your application
          </Link>
        </p>
      </>
    );
  }

  const { offer, loan, account, mandate, consent } = s;
  const cost = loanCost(offer.amount, offer.ratePct, offer.months);
  const rows = schedule(offer.amount, offer.ratePct, offer.months);
  const dates = dueDates(loan.signedAt, offer.months);
  const coolingOffEnds = new Date(loan.signedAt);
  coolingOffEnds.setUTCDate(coolingOffEnds.getUTCDate() + COOLING_OFF_DAYS);
  const inCoolingOff = new Date() < coolingOffEnds;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Loan {loan.id}</p>
          <h1 className="text-2xl font-bold">{formatInr(offer.amount)} loan</h1>
          <p className="mt-1 text-muted">From {SITE.lendingPartner}, signed {formatDate(loan.signedAt)}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted underline">
            Sign out
          </button>
        </form>
      </div>

      <p className="mt-6 rounded-lg bg-tint p-4">
        <span className="font-semibold">{SANDBOX ? "Test loan: no money has moved." : "Disbursal in progress."}</span>{" "}
        {formatInr(cost.netDisbursal)} {SANDBOX ? "would be" : "will be"} paid into your account ending {account.last4}.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat term="Monthly EMI" value={formatInr(cost.emi)} />
        <Stat term="Next EMI" value={formatDate(dates[0])} />
        <Stat term="Interest rate" value={`${offer.ratePct}% a year`} />
        <Stat term="APR" value={`${cost.aprPct.toFixed(2)}%`} />
      </dl>

      <h2 className="mt-10 text-xl font-bold">Repayment schedule</h2>
      <p className="mt-1 text-sm text-muted">
        Auto-debited by {mandate.method === "upi" ? "UPI AutoPay" : "e-NACH"} from account ending {account.last4}. You can repay
        early at any time.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">Due date</th>
              <th className="py-2 pr-4 text-right font-medium">EMI</th>
              <th className="py-2 pr-4 text-right font-medium">Principal</th>
              <th className="py-2 pr-4 text-right font-medium">Interest</th>
              <th className="py-2 text-right font-medium">Balance after</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, i) => (
              <tr key={row.month}>
                <td className="py-2 pr-4">{formatDate(dates[i])}</td>
                <td className="py-2 pr-4 text-right">{formatInr(row.emi)}</td>
                <td className="py-2 pr-4 text-right">{formatInr(row.principal)}</td>
                <td className="py-2 pr-4 text-right">{formatInr(row.interest)}</td>
                <td className="py-2 text-right">{formatInr(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-bold">Cooling-off period</h2>
      {inCoolingOff ? (
        <form action={exitDuringCoolingOff} className="mt-2">
          <p className="text-muted">
            Until {formatDate(coolingOffEnds)} you can exit this loan with no penalty by repaying the principal and the interest
            for the days you had it.
          </p>
          <button type="submit" className="mt-3 rounded-lg border border-action px-4 py-2 font-semibold text-action hover:bg-tint">
            Exit this loan
          </button>
        </form>
      ) : (
        <p className="mt-2 text-muted">The cooling-off period ended on {formatDate(coolingOffEnds)}.</p>
      )}

      {consent && (
        <>
          <h2 className="mt-10 text-xl font-bold">Your consents</h2>
          <ul className="mt-2 space-y-3 text-sm">
            <li>Credit report check, given {formatDate(consent.bureauAt)}.</li>
            <li className="flex flex-wrap items-center gap-3">
              <span>
                Bank statements via Account Aggregator, given {formatDate(consent.aaAt)}
                {consent.aaRevokedAt ? `, withdrawn ${formatDate(consent.aaRevokedAt)}.` : "."}
              </span>
              {!consent.aaRevokedAt && (
                <form action={withdrawAaConsent}>
                  <button type="submit" className="text-action underline">
                    Withdraw
                  </button>
                </form>
              )}
            </li>
          </ul>
        </>
      )}

      <h2 className="mt-10 text-xl font-bold">Need help?</h2>
      <p className="mt-2 text-muted">
        Write to{" "}
        <a href={`mailto:${SITE.support.email}`} className="underline">
          {SITE.support.email}
        </a>{" "}
        or see{" "}
        <Link href="/grievance" className="underline">
          how to raise a complaint
        </Link>
        .
      </p>
    </>
  );
}

function Stat({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <dt className="text-sm text-muted">{term}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
