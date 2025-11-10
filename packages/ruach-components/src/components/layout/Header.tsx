"use client";
import { NavLink } from "../ruach/ui/NavLink";
import Logo from "../ruach/ui/Logo";
import { useSession } from "next-auth/react";

export default function Header() {
  const { status } = useSession();
  return (
    <header className="bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Logo className="h-6 w-auto" />
        <nav className="hidden gap-6 md:flex">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/media">Media</NavLink>
          <NavLink href="/courses">Courses</NavLink>
          <NavLink href="/give">Give</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
          {status === "authenticated"
            ? <a className="text-white/90 hover:text-white" href="/logout">Logout</a>
            : <a className="text-white/90 hover:text-white" href="/login">Login</a>}
        </nav>
      </div>
    </header>
  );
}
