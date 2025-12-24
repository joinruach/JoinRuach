"use client";
import Link from "next-intl/link";
import type { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";

export function NavLink({ href, children, className, ...props }:
  LinkProps & { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const locale = useLocale();
  const normalizedHref =
    typeof href === "string" && href.startsWith("/")
      ? `/${locale}${href === "/" ? "" : href}`
      : href;
  const active =
    typeof normalizedHref === "string"
      ? pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`)
      : false;
  return (
    <Link href={href} {...props}>
      <span
        className={cn(
          "text-sm font-medium text-zinc-900 transition hover:text-zinc-950 dark:text-white dark:hover:text-white/80",
          active && "text-zinc-900 font-semibold dark:text-white",
          className
        )}
      >
        {children}
      </span>
    </Link>
  );
}
