"use client";
import { useState } from "react";
import Image from "next/image";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import { useSession } from "next-auth/react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LocaleSwitcher from "@/components/locale/LocaleSwitcher";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/start", label: "Start Here" },
  { href: "/media", label: "Media" },
  { href: "/partners", label: "Partners" },
      { href: "/builders", label: "Builders" },
];

const ABOUT_LINKS = [
  { href: "/about", label: "Our Mission" },
  { href: "/team", label: "Team & Leadership" },
  { href: "/beliefs", label: "What We Believe" },
  { href: "/transparency", label: "Financial Transparency" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-subtle bg-white/95 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand */}
        <LocalizedLink href="/" aria-label="Ruach Ministries Home">
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
              <span className="text-base font-bold uppercase tracking-[0.35em] text-zinc-900 dark:text-white">
                Ruach
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.45em] text-zinc-700 dark:text-neutral-400">
                Ministries
              </span>
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-700 dark:text-neutral-300 sm:hidden">
              Ruach Ministries
            </span>
          </span>
        </LocalizedLink>

        {/* Navigation */}
        <nav className="hidden flex-1 items-center justify-center gap-1 text-sm font-medium lg:flex">
          {NAV_LINKS.map((link) => (
            <LocalizedLink key={link.href} href={link.href}>
              <span className="rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white">
                {link.label}
              </span>
            </LocalizedLink>
          ))}
          {/* About Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button className="rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white">
              About ▾
            </button>
            {aboutOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-zinc-200 bg-white py-2 shadow-xl dark:border-white/10 dark:bg-zinc-900">
                {ABOUT_LINKS.map((link) => (
                  <LocalizedLink key={link.href} href={link.href}>
                    <span className="block px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white">
                      {link.label}
                    </span>
                  </LocalizedLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Utilities + Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-zinc-500 dark:text-zinc-400 lg:flex">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3">
            {status === "authenticated" ? (
              <LocalizedLink href="/logout">
                <span className="text-sm font-semibold text-zinc-900 transition hover:text-ruachGold dark:text-white dark:hover:text-ruachGold">
                  Logout
                </span>
              </LocalizedLink>
            ) : (
              <LocalizedLink href="/signup" className="hidden md:inline-flex">
                <span className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900 hover:text-ruachDark dark:border-white/30 dark:text-white dark:hover:border-white dark:hover:text-white">
                  Login / Signup
                </span>
              </LocalizedLink>
            )}
            <LocalizedLink href="/give">
              <span className="rounded-lg bg-ruachGold px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-ruachGold/90">
                Give
              </span>
            </LocalizedLink>
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation menu"
            className="md:hidden rounded-md p-2 text-ruachDark transition hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10"
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
        <div className="border-t border-subtle bg-white/95 px-6 py-4 text-sm shadow md:hidden dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="space-y-2">
            {NAV_LINKS.map((link) => (
              <LocalizedLink
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                <span className="block rounded-lg px-3 py-2 text-zinc-900 transition hover:bg-neutral-100 hover:text-ruachDark dark:text-white dark:hover:bg-white/5">
                  {link.label}
                </span>
              </LocalizedLink>
            ))}
            {/* About submenu for mobile */}
            <div className="border-t border-zinc-200 dark:border-white/10 pt-2 mt-2">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-white/60">
                About
              </div>
              {ABOUT_LINKS.map((link) => (
                <LocalizedLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                >
                  <span className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-neutral-100 hover:text-ruachDark dark:text-zinc-300 dark:hover:bg-white/5">
                    {link.label}
                  </span>
                </LocalizedLink>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            {status === "authenticated" ? (
              <LocalizedLink
                href="/logout"
                onClick={() => setOpen(false)}
              >
                <span className="block rounded-lg px-3 py-2 text-zinc-900 transition hover:bg-neutral-100 hover:text-ruachDark dark:text-white dark:hover:bg-white/5">
                  Logout
                </span>
              </LocalizedLink>
            ) : null}
            <LocalizedLink
              href="/give"
              onClick={() => setOpen(false)}
            >
              <span className="flex items-center justify-center rounded-lg bg-ruachGold px-4 py-2 font-semibold text-white transition hover:bg-ruachGold/90">
                Give
              </span>
            </LocalizedLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
