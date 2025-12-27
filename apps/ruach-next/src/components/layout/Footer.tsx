import Link from "next-intl/link";
import NewsletterSignup from "@/components/ruach/NewsletterSignup";

type SocialPlatform = "instagram" | "youtube" | "facebook" | "spotify";

type SocialLink = {
  label: string;
  href: string;
  icon: SocialPlatform;
};

const startHereLinks = [
  { label: "Start Here", href: "/start" },
  { label: "Carry the Fire", href: "/carry" },
  { label: "About Our Mission", href: "/about" },
  { label: "Team & Leadership", href: "/team" }
];

const trustLinks = [
  { label: "What We Believe", href: "/beliefs" },
  { label: "Financial Transparency", href: "/transparency" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "FAQ", href: "/faq" }
];

const connectLinks = [
  { label: "Media", href: "/media" },
  { label: "Courses", href: "/courses" },
  { label: "Builders", href: "/builders" },
  { label: "Partners", href: "/partners" },
  { label: "Prayer Requests", href: "/prayer" },
  { label: "Contact", href: "/contact" }
];

const defaultSocialLinks: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/joinruach/", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com/@JoinRuach", icon: "youtube" },
  { label: "Facebook", href: "https://www.facebook.com/joinruach/", icon: "facebook" },
  { label: "Spotify", href: "https://open.spotify.com/show/2A0pJE9naftDgX5nGooy6C", icon: "spotify" }
];

function resolveSocialLinks(): SocialLink[] {
  const links = [
    {
      label: "Instagram",
      href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      icon: "instagram" as const
    },
    {
      label: "YouTube",
      href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || process.env.NEXT_PUBLIC_YOUTUBE_URL,
      icon: "youtube" as const
    },
    {
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || process.env.NEXT_PUBLIC_FACEBOOK_URL,
      icon: "facebook" as const
    },
    {
      label: "Spotify",
      href: process.env.NEXT_PUBLIC_SOCIAL_SPOTIFY || process.env.NEXT_PUBLIC_SPOTIFY_URL,
      icon: "spotify" as const
    }
  ].filter((link): link is SocialLink => typeof link.href === "string" && link.href.trim().length > 0);

  return links.length ? links : defaultSocialLinks;
}

function SocialIcon({ name }:{ name: SocialPlatform }) {
  switch (name) {
    case "instagram":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
          <circle cx="12" cy="12" r="3.8" />
          <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.59 7.26a2.75 2.75 0 0 0-1.93-1.94C17.66 5 12 5 12 5s-5.66 0-7.66.32a2.75 2.75 0 0 0-1.93 1.94A28.24 28.24 0 0 0 2 12a28.24 28.24 0 0 0 .41 4.74 2.75 2.75 0 0 0 1.93 1.94C6.34 19 12 19 12 19s5.66 0 7.66-.32a2.75 2.75 0 0 0 1.93-1.94A28.24 28.24 0 0 0 22 12a28.24 28.24 0 0 0-.41-4.74ZM10 15.27V8.73L15.5 12Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 21v-7h2.4l.36-2.8H13.5v-1.8c0-.8.22-1.34 1.37-1.34H16.4V5.5c-.24 0-1.08-.1-2.06-.1-2.04 0-3.34 1.25-3.34 3.54v2h-2.24V14h2.24v7Z" />
        </svg>
      );
    case "spotify":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.56 14.4a.75.75 0 0 1-1.03.25 9.36 9.36 0 0 0-8.61 0 .75.75 0 0 1-.78-1.29 10.86 10.86 0 0 1 10.17 0 .75.75 0 0 1 .25 1Z" />
          <path d="M16.53 12.36a.9.9 0 0 1-1.24.3 7.94 7.94 0 0 0-7.36 0 .9.9 0 0 1-.84-1.6 9.73 9.73 0 0 1 9.04 0 .9.9 0 0 1 .4 1.3Z" />
          <path d="M16.39 10.03c-2.92-1.73-7.8-1.9-10.3-.75a.9.9 0 0 1-.77-1.64c2.96-1.4 8.42-1.2 11.84.84a.9.9 0 0 1-.9 1.55Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Footer(){
  const socialLinks = resolveSocialLinks();
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Identity Section */}
        <div className="mb-8 space-y-2">
          <h2 className="text-lg font-semibold uppercase tracking-wide">
            Ruach Ministries
          </h2>
          <p className="max-w-3xl text-sm text-white/70">
            Ruach is a prophetic media ministry and builder movement that forms, equips, and sends believers to carry freedom and establish Kingdom communities.
          </p>
        </div>

        {/* Column Links */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Start Here Column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              Start Here
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              {startHereLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="transition hover:text-white">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              Connect
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              {connectLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="transition hover:text-white">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust Column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              Trust
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              {trustLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="transition hover:text-white">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact Column */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              Legal
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>501(c)(3) nonprofit</li>
              <li>EIN: 33-3149173</li>
              <li className="mt-4">
                <a href="mailto:hello@joinruach.org" className="transition hover:text-white">
                  hello@joinruach.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Follow
          </h3>
          {socialLinks.length ? (
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-amber-400 hover:text-amber-300"
                >
                  <SocialIcon name={social.icon} />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Ruach Ministries. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
