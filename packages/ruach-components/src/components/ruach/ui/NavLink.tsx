"use client";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../../lib/cn";

export function NavLink({ href, children, className, ...props }:
  LinkProps & { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const active = (() => {
    if (typeof href !== "string") return false;
    if (href === "/") return pathname === "/";
    const normalizedHref = href.endsWith("/") ? href.slice(0, -1) : href;
    const normalizedPath = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
  })();
  return (
    <Link href={href} className={cn(
      "text-white/90 hover:text-white transition",
      active && "text-white font-semibold", className
    )} {...props}>{children}</Link>
  );
}
