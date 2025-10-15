import { cn } from "@/lib/cn";

export type SpeakerCardLayout = "vertical" | "horizontal";

export interface SpeakerCardProps {
  name: string;
  displayName?: string | null;
  role?: string | null;
  organization?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  photoAlt?: string | null;
  layout?: SpeakerCardLayout;
  showBio?: boolean;
  className?: string;
}

const layoutClasses: Record<SpeakerCardLayout, string> = {
  vertical: "p-6 text-center md:text-left",
  horizontal: "flex items-start gap-4 p-5 text-left",
};

const imageWrapperClasses: Record<SpeakerCardLayout, string> = {
  vertical: "mb-4 overflow-hidden rounded-2xl bg-neutral-100",
  horizontal: "h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-neutral-100",
};

const imageClasses: Record<SpeakerCardLayout, string> = {
  vertical: "h-40 w-full object-cover",
  horizontal: "h-full w-full object-cover",
};

const bodyClasses: Record<SpeakerCardLayout, string> = {
  vertical: "",
  horizontal: "flex-1 min-w-0",
};

export default function SpeakerCard({
  name,
  displayName,
  role,
  organization,
  bio,
  photoUrl,
  photoAlt,
  layout = "vertical",
  showBio = true,
  className,
}: SpeakerCardProps) {
  const title = displayName?.trim() || name;
  const subtitle = role ?? organization ?? undefined;
  const shouldShowBio = showBio && !!bio;

  return (
    <article
      className={cn("rounded-3xl border border-neutral-200 bg-white shadow-sm", layoutClasses[layout], className)}
    >
      {photoUrl ? (
        <div className={imageWrapperClasses[layout]}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt={photoAlt || title} className={imageClasses[layout]} />
        </div>
      ) : null}
      <div className={bodyClasses[layout]}>
        <div className="text-lg font-semibold text-neutral-900">{title}</div>
        {subtitle ? (
          <div className="text-xs uppercase tracking-wide text-neutral-500">{subtitle}</div>
        ) : null}
        {shouldShowBio ? (
          <p
            className={cn(
              "mt-3 text-sm text-neutral-600",
              layout === "horizontal" ? "line-clamp-3" : undefined,
            )}
          >
            {bio}
          </p>
        ) : null}
      </div>
    </article>
  );
}
