import "server-only";

/**
 * Recommendation Engine
 *
 * Scoring formula: 0.4 * popularity + 0.3 * tagAffinity + 0.2 * freshness + 0.1 * similarity
 *
 * For anonymous users, falls back to popularity-only scoring.
 */

interface ContentCandidate {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  type?: string;
  views: number;
  publishedAt: string;
  tags: string[];
  speakers: string[];
}

interface ScoredRecommendation {
  contentType: string;
  contentId: number;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  score: number;
  reason: string;
  metadata: {
    type?: string;
    views?: number;
    speakers?: string[];
    tags?: string[];
  };
}

interface UserHistory {
  title: string;
  contentType: string;
  tags?: string[];
}

/**
 * Compute tag affinity from user's viewing history.
 * Returns a map of tag → frequency weight (0-1 normalized).
 */
export function computeTagAffinity(
  userHistory: UserHistory[]
): Map<string, number> {
  const tagCounts = new Map<string, number>();

  for (const item of userHistory) {
    for (const tag of item.tags || []) {
      const lower = tag.toLowerCase();
      tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
    }
  }

  const maxCount = Math.max(...tagCounts.values(), 1);
  const affinity = new Map<string, number>();

  for (const [tag, count] of tagCounts) {
    affinity.set(tag, count / maxCount);
  }

  return affinity;
}

/**
 * Score a single content candidate
 */
export function scoreContent(
  candidate: ContentCandidate,
  tagAffinity: Map<string, number>,
  maxViews: number,
  now: number
): { score: number; reason: string } {
  // Popularity: normalized view count (0-1)
  const popularity = maxViews > 0 ? candidate.views / maxViews : 0;

  // Tag affinity: average affinity of matching tags (0-1)
  let tagScore = 0;
  const matchedTags: string[] = [];
  if (tagAffinity.size > 0 && candidate.tags.length > 0) {
    let totalAffinity = 0;
    for (const tag of candidate.tags) {
      const aff = tagAffinity.get(tag.toLowerCase()) || 0;
      if (aff > 0) {
        totalAffinity += aff;
        matchedTags.push(tag);
      }
    }
    tagScore = candidate.tags.length > 0 ? totalAffinity / candidate.tags.length : 0;
  }

  // Freshness: decay over 90 days (1.0 for today, ~0 after 90 days)
  const publishedMs = new Date(candidate.publishedAt).getTime();
  const ageMs = now - publishedMs;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const freshness = Math.max(0, 1 - ageDays / 90);

  // Blended score
  const score = 0.4 * popularity + 0.3 * tagScore + 0.2 * freshness + 0.1 * 0.5;

  // Build reason string
  let reason: string;
  if (matchedTags.length > 0) {
    reason = `Matches your interest in ${matchedTags.slice(0, 2).join(' & ')}`;
  } else if (popularity > 0.7) {
    reason = 'Popular with the Ruach community';
  } else if (freshness > 0.7) {
    reason = 'Recently published';
  } else {
    reason = 'Recommended for you';
  }

  return { score, reason };
}

/**
 * Generate personalized recommendations
 */
export function generateRecommendations(
  candidates: ContentCandidate[],
  userHistory: UserHistory[],
  limit: number
): ScoredRecommendation[] {
  const tagAffinity = computeTagAffinity(userHistory);
  const maxViews = Math.max(...candidates.map((c) => c.views), 1);
  const now = Date.now();

  // Filter out already-watched content
  const watchedTitles = new Set(userHistory.map((h) => h.title.toLowerCase()));
  const unseen = candidates.filter(
    (c) => !watchedTitles.has(c.title.toLowerCase())
  );

  const scored = unseen.map((candidate) => {
    const { score, reason } = scoreContent(candidate, tagAffinity, maxViews, now);

    return {
      contentType: 'media' as const,
      contentId: candidate.id,
      title: candidate.title,
      description: candidate.description || '',
      url: `/media/${candidate.slug}`,
      thumbnailUrl: candidate.thumbnailUrl,
      score,
      reason,
      metadata: {
        type: candidate.type,
        views: candidate.views,
        speakers: candidate.speakers,
        tags: candidate.tags,
      },
    };
  });

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Popularity-only fallback for anonymous users
 */
export function popularityRecommendations(
  candidates: ContentCandidate[],
  limit: number
): ScoredRecommendation[] {
  const maxViews = Math.max(...candidates.map((c) => c.views), 1);

  return candidates
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map((candidate) => ({
      contentType: 'media' as const,
      contentId: candidate.id,
      title: candidate.title,
      description: candidate.description || '',
      url: `/media/${candidate.slug}`,
      thumbnailUrl: candidate.thumbnailUrl,
      score: candidate.views / maxViews,
      reason: 'Popular with the Ruach community',
      metadata: {
        type: candidate.type,
        views: candidate.views,
        speakers: candidate.speakers,
        tags: candidate.tags,
      },
    }));
}
