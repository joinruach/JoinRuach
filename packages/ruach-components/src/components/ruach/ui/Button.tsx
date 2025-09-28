import { cn } from "../../../lib/cn";
import Link from "next/link";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "black" | "white" | "gold";
  size?: "sm" | "md";
  as?: "button" | "a";
  href?: string;
};

export function Button({ variant="black", size="md", className, as="button", href, ...props }: Props) {
  const cls = cn(
    "rounded-lg font-semibold transition inline-flex items-center justify-center",
    size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2",
    variant === "black" && "bg-black text-white hover:bg-black/90",
    variant === "white" && "bg-white text-black hover:bg-neutral-100 ring-1 ring-black/10",
    variant === "gold" && "bg-amber-500 text-black hover:bg-amber-400",
    className
  );
  if (as === "a" && href) return <Link href={href} className={cls} {...(props as any)} />;
  return <button className={cls} {...props} />;
}
