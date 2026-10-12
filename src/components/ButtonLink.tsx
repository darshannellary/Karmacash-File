import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & { variant?: "primary" | "secondary"; size?: "sm" | "md" };

export function ButtonLink({ variant = "primary", size = "md", className = "", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-lg font-semibold transition-colors";
  const sizes = size === "sm" ? "px-3 py-2 text-sm" : "px-5 py-3 text-base";
  const variants =
    variant === "primary"
      ? "bg-action text-white hover:bg-action-hover"
      : "border border-action text-action hover:bg-tint";
  return <Link className={`${base} ${sizes} ${variants} ${className}`} {...props} />;
}
