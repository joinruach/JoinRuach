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
  const cls = cn("rounded-lg font-semibold transition inline-flex items-center justify-center",
    size==="sm"?"px-3 py-1.5 text-sm":"px-4 py-2",
    variant==="black"&&"bg-black text-white hover:bg-black/90",
    variant==="white"&&"bg-white text-black hover:bg-neutral-100 ring-1 ring-black/10",
    variant==="gold"&&"bg-amber-500 text-black hover:bg-amber-400", className);

  if (as==="a" && href) {
    const linkProps = props as Omit<ComponentPropsWithoutRef<typeof Link>, "href">;
    return <Link href={href} className={cls} {...linkProps} />;
  }

  const buttonProps = props as ComponentPropsWithoutRef<"button">;
  return <button className={cls} {...buttonProps} />;
}
