import { cn } from "@/lib/cn";
import Link from "next-intl/link";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "black" | "white" | "gold";
type ButtonSize = "sm" | "md";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonAsButton = BaseProps & {
  as?: "button";
  href?: never;
} & ComponentPropsWithoutRef<"button">;

type ButtonAsLink = BaseProps & {
  as: "a";
  href: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href">;

type Props = ButtonAsButton | ButtonAsLink;

export function Button({ variant="black", size="md", className, as="button", href, ...props }: Props) {
  const cls = cn(
    "inline-flex items-center justify-center rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-[hsl(var(--background))]",
    size==="sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2",
    variant==="black" && "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[#242424]",
    variant==="white" && "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] ring-1 ring-[rgba(43,43,43,0.15)]",
    variant==="gold" && "bg-[#D4B58A] text-[hsl(var(--foreground))] hover:bg-[#C7A574] shadow-[0_12px_30px_rgba(212,181,138,0.45)]",
    className
  );

  if (as==="a" && href) {
    const linkProps = props as Omit<ComponentPropsWithoutRef<typeof Link>, "href">;
    return <Link href={href} {...linkProps}><span className={cls}>{props.children}</span></Link>;
  }

  const buttonProps = props as ComponentPropsWithoutRef<"button">;
  return <button className={cls} {...buttonProps} />;
}
