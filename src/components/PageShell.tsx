import type { ReactNode } from "react";

export function PageShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function DraftNotice() {
  return (
    <p className="rounded-lg border border-line bg-tint p-4 text-sm text-muted">
      Draft for compliance review. Final wording will be confirmed with our lending partner before launch.
    </p>
  );
}
