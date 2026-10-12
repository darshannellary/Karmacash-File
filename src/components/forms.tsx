"use client";

import { type ReactNode, useActionState } from "react";
import type { FormState } from "@/lib/form-state";

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** A step's form: shows the action's error, and disables the button while it runs. */
export function StepForm({
  action,
  submitLabel,
  children,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-5">
      {children}
      {state?.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-action px-5 py-3 font-semibold text-white hover:bg-action-hover disabled:opacity-60"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
