"use client";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({ href, children, className, ...props }:
  LinkProps & { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const active = pathname === href || (typeof href === "string" && pathname.startsWith(href));
  return (
    <Link href={href} className={cn(
      "text-white/90 hover:text-white transition",
      active && "text-white font-semibold", className
    )} {...props}>{children}</Link>
  );
}
