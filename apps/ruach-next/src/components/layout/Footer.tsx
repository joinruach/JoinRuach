import Link from "next/link";
import NewsletterSignup from "@/components/ruach/NewsletterSignup";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Media", href: "/media" },
  { label: "Courses", href: "/courses" },
  { label: "Give", href: "/give" },
  { label: "Contact", href: "/contact" }
];

const resolveSocialLinks = () => [
  { label: "Instagram", href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, icon: "instagram" },
  { label: "YouTube", href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE, icon: "youtube" },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, icon: "facebook" },
  { label: "Spotify", href: process.env.NEXT_PUBLIC_SOCIAL_SPOTIFY, icon: "spotify" }
].filter((link) => Boolean(link.href));

function SocialIcon({ name }:{ name: string }) {
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
        <div className="grid gap-10 md:grid-cols-[1.1fr,1fr,1fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ruach Ministries</h2>
            <p className="text-sm text-white/70">
              Carrying the breath of God through media, discipleship, and compassionate outreach.
            </p>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wide text-white/60">Quick Links</div>
              <ul className="mt-3 space-y-2 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link className="text-white/70 transition hover:text-white" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/60">Newsletter</div>
              <p className="mt-2 text-sm text-white/70">
                Subscribe for testimonies, course releases, and upcoming events.
              </p>
            </div>
            <NewsletterSignup variant="dark" id="footer-newsletter" />
          </div>

          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wide text-white/60">Connect</div>
            <p className="text-sm text-white/70">
              Follow Ruach Studios for behind-the-scenes stories and livestreams.
            </p>
            {socialLinks.length ? (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-amber-400 hover:text-amber-300"
                  >
                    <SocialIcon name={social.icon} />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/60">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Ruach Ministries. All rights reserved.</p>
            <div className="space-y-1 text-left md:text-right">
              <p>Ruach Ministries is a registered 501(c)(3) organization. Gifts are tax-deductible as allowed by law.</p>
              <p>EIN: 33-3149173</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
