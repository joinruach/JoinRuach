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
      <span className={cn(
        "text-sm font-medium text-neutral-600 transition hover:text-ruachGold dark:text-neutral-200 dark:hover:text-ruachGold/90",
        active && "text-ruachDark font-semibold dark:text-white",
        className
      )}>{children}</span>
    </Link>
  );
}
