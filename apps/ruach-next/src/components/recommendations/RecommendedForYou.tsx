import { getJSON, imgUrl } from '@/lib/strapi';
import Link from 'next/link';
import Image from 'next/image';

interface RecommendedContent {
  contentType: string;
  contentId: number;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  score: number;
  reason: string;
  metadata?: {
    type?: string;
    speakers?: string[];
    tags?: string[];
  };
}

interface Props {
  userId?: number;
  limit?: number;
  contentType?: string;
}

export default async function RecommendedForYou({ userId, limit = 6, contentType }: Props) {
  let recommendations: RecommendedContent[] = [];

  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(userId && { userId: userId.toString() }),
      ...(contentType && { type: contentType }),
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:3000'}/api/recommendations?${params}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }

    const data = (await response.json().catch(() => null)) as { recommendations?: RecommendedContent[] } | null;
    if (Array.isArray(data?.recommendations)) {
      recommendations = data.recommendations;
    }
  } catch (error) {
    console.error('Failed to load recommendations:', error);
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Recommended For You</h2>
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="text-sm text-white/60">AI Powered</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((item, index) => (
            <Link
              key={`${item.contentType}-${item.contentId}-${index}`}
              href={item.url}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-amber-500/50 hover:bg-white/10"
            >
              {/* Thumbnail */}
              {item.thumbnailUrl ? (
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={imgUrl(item.thumbnailUrl) ?? item.thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60"></div>
                </div>
              ) : (
                <div className="relative aspect-video w-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-amber-500/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Type Badge */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                    {item.metadata?.type || item.contentType}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mb-2 line-clamp-2 font-semibold text-white group-hover:text-amber-500">
                  {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-white/60">
                    {item.description}
                  </p>
                )}

                {/* Metadata */}
                {item.metadata?.speakers && item.metadata.speakers.length > 0 && (
                  <p className="mb-2 text-xs text-white/40">
                    {item.metadata.speakers.join(', ')}
                  </p>
                )}

                {/* Reason */}
                <p className="text-xs italic text-amber-500/80">{item.reason}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
  );
}
