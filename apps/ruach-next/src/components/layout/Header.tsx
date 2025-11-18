"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next-intl/link";
import { useSession } from "next-auth/react";
import { NavLink } from "@ruach/components/components/ruach/ui/NavLink";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LocaleSwitcher from "@/components/locale/LocaleSwitcher";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/media", label: "Media & Testimonies" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resources" },
  { href: "/conferences", label: "Conferences" },
  { href: "/community-outreach", label: "Community Outreach" },
  { href: "/give", label: "Give", highlight: true },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const primaryLinks = NAV_LINKS.filter((link) => !link.highlight);
  const primaryAction = NAV_LINKS.find((link) => link.highlight);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md shadow-sm dark:border-white/10 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Ruach Ministries Home">
            <span className="flex items-center gap-3">
              <Image
                src="/ruach-logo.svg"
                alt="Ruach Ministries logo"
                width={42}
                height={42}
                className="h-11 w-11"
                priority
              />
              <span className="hidden leading-tight sm:flex sm:flex-col">
                <span className="text-base font-bold uppercase tracking-[0.35em] text-ruachDark dark:text-white">
                  Ruach
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.45em] text-neutral-500 dark:text-neutral-400">
                  Ministries
                </span>
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-300 sm:hidden">
                Ruach Ministries
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {primaryLinks.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          <LocaleSwitcher />

          {status === "authenticated" ? (
            <Link href="/logout">
              <span className="text-sm font-semibold text-neutral-600 transition hover:text-ruachGold dark:text-neutral-200 dark:hover:text-ruachGold">
                Logout
              </span>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <span className="text-sm font-semibold text-neutral-600 transition hover:text-ruachGold dark:text-neutral-200 dark:hover:text-ruachGold">
                  Login
                </span>
              </Link>
              <Link href="/signup">
                <span className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-900 hover:text-ruachDark dark:border-white/30 dark:text-white dark:hover:border-white dark:hover:text-white">
                  Signup
                </span>
              </Link>
            </>
          )}

          {primaryAction ? (
            <Link href={primaryAction.href}>
              <span className="rounded-lg bg-ruachGold px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-ruachGold/90">
                {primaryAction.label}
              </span>
            </Link>
          ) : null}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <LocaleSwitcher />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="rounded-md p-2 text-ruachDark transition hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {open ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-neutral-200 bg-white/95 px-6 py-4 text-sm shadow md:hidden dark:border-white/10 dark:bg-neutral-900">
          <div className="space-y-2">
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                <span className="block rounded-lg px-3 py-2 text-neutral-700 transition hover:bg-neutral-100 hover:text-ruachDark dark:text-neutral-100 dark:hover:bg-white/5">
                  {item.label}
                </span>
              </Link>
            ))}
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                onClick={() => setOpen(false)}
              >
                <span className="flex items-center justify-center rounded-lg bg-ruachGold px-4 py-2 font-semibold text-white transition hover:bg-ruachGold/90">
                  {primaryAction.label}
                </span>
              </Link>
            ) : null}

            {status === "authenticated" ? (
              <Link
                href="/logout"
                onClick={() => setOpen(false)}
              >
                <span className="block rounded-lg px-3 py-2 text-neutral-700 transition hover:bg-neutral-100 hover:text-ruachDark dark:text-neutral-100 dark:hover:bg-white/5">
                  Logout
                </span>
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                >
                  <span className="block rounded-lg px-3 py-2 text-neutral-700 transition hover:bg-neutral-100 hover:text-ruachDark dark:text-neutral-100 dark:hover:bg-white/5">
                    Login
                  </span>
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 font-semibold text-neutral-900 transition hover:border-neutral-900 hover:text-ruachDark dark:border-white/30 dark:text-white dark:hover:border-white dark:hover:text-white">
                    Signup
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
