"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { NavLink } from "@ruach/components/components/ruach/ui/NavLink";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/media", label: "Media & Testimonies" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resources" },
  { href: "/conferences", label: "Conferences" },
  { href: "/community-outreach", label: "Community Outreach" },
  { href: "/give", label: "Give", highlight: true },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export default function Header() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Ruach Ministries Home" className="flex items-center gap-3">
          <Image
            src="/ruach-logo.svg"
            alt="Ruach Ministries logo"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <div className="hidden leading-tight sm:flex sm:flex-col">
            <span className="text-base font-bold uppercase tracking-[0.35em] text-white">
              Ruach
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.45em] text-white/70">
              Ministries
            </span>
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70 sm:hidden">
            Ruach Ministries
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {NAV_LINKS.map((item) => (
            item.highlight ? (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-amber-500 px-4 py-1.5 font-semibold text-black transition hover:bg-amber-400"
              >
                {item.label}
              </Link>
            ) : (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            )
          ))}

          {status === "authenticated" ? (
            <div className="flex items-center gap-4">
              <Link href="/logout" className="text-white/80 transition hover:text-white">
                Logout
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-white/80 transition hover:text-white">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-white/20 px-4 py-1.5 text-white/90 transition hover:border-white hover:text-white"
              >
                Signup
              </Link>
            </div>
          )}
        </nav>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation menu"
        >
          <svg
            className="h-6 w-6 text-white"
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

      {open ? (
        <div className="md:hidden">
          <div className="space-y-1 border-t border-white/10 bg-black/95 px-4 py-4 text-sm">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.highlight
                  ? "flex w-full items-center justify-center rounded-full bg-amber-500 px-4 py-2 font-semibold text-black"
                  : "block rounded-lg px-3 py-2 text-white/80 transition hover:bg-white/10 hover:text-white"}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {status === "authenticated" ? (
              <Link
                href="/logout"
                className="block rounded-lg px-3 py-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                Logout
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-white"
                  onClick={() => setOpen(false)}
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
