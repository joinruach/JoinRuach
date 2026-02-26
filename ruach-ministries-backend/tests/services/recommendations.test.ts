/**
 * Tests for Recommendations Engine
 *
 * Tests the scoring, tag affinity, and recommendation generation logic.
 * Source: apps/ruach-next/src/lib/recommendations.ts
 */

import {
  computeTagAffinity,
  scoreContent,
  generateRecommendations,
  popularityRecommendations,
} from '../../../apps/ruach-next/src/lib/recommendations';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

const now = new Date('2026-02-26T12:00:00Z');
const nowMs = now.getTime();
const day = 1000 * 60 * 60 * 24;

function daysAgo(n: number): string {
  return new Date(nowMs - n * day).toISOString();
}

const candidates: ContentCandidate[] = [
  {
    id: 1,
    title: 'Worship Night Live',
    slug: 'worship-night-live',
    description: 'A live worship session',
    views: 5000,
    publishedAt: daysAgo(2), // very fresh
    tags: ['worship', 'live', 'music'],
    speakers: ['Pastor A'],
    type: 'video',
  },
  {
    id: 2,
    title: 'Deep Dive: Prayer',
    slug: 'deep-dive-prayer',
    description: 'Teaching on prayer',
    views: 3000,
    publishedAt: daysAgo(30),
    tags: ['prayer', 'teaching'],
    speakers: ['Pastor B'],
    type: 'video',
  },
  {
    id: 3,
    title: 'Community Outreach',
    slug: 'community-outreach',
    description: 'Outreach event highlights',
    views: 1000,
    publishedAt: daysAgo(60),
    tags: ['outreach', 'community'],
    speakers: ['Pastor C'],
    type: 'video',
  },
  {
    id: 4,
    title: 'Old Archive: Foundations',
    slug: 'old-archive-foundations',
    description: 'Archived series from last year',
    views: 200,
    publishedAt: daysAgo(120), // older than 90 days
    tags: ['teaching', 'foundations'],
    speakers: ['Pastor D'],
    type: 'audio',
  },
  {
    id: 5,
    title: 'Most Popular Sermon',
    slug: 'most-popular-sermon',
    description: 'The most viewed sermon',
    views: 10000,
    publishedAt: daysAgo(45),
    tags: ['sermon', 'worship'],
    speakers: ['Pastor A'],
    type: 'video',
  },
];

// ---------------------------------------------------------------------------
// computeTagAffinity
// ---------------------------------------------------------------------------

describe('computeTagAffinity', () => {
  it('returns empty map for empty history', () => {
    const affinity = computeTagAffinity([]);
    expect(affinity.size).toBe(0);
  });

  it('returns normalized tag frequencies with most common tag = 1.0', () => {
    const history = [
      { title: 'A', contentType: 'media', tags: ['worship', 'prayer'] },
      { title: 'B', contentType: 'media', tags: ['worship', 'teaching'] },
      { title: 'C', contentType: 'media', tags: ['worship'] },
    ];

    const affinity = computeTagAffinity(history);

    // 'worship' appears 3 times (max), should be 1.0
    expect(affinity.get('worship')).toBe(1.0);
    // 'prayer' appears 1 time → 1/3
    expect(affinity.get('prayer')).toBeCloseTo(1 / 3);
    // 'teaching' appears 1 time → 1/3
    expect(affinity.get('teaching')).toBeCloseTo(1 / 3);
  });

  it('handles case-insensitive tag matching', () => {
    const history = [
      { title: 'A', contentType: 'media', tags: ['Worship'] },
      { title: 'B', contentType: 'media', tags: ['WORSHIP'] },
      { title: 'C', contentType: 'media', tags: ['worship'] },
    ];

    const affinity = computeTagAffinity(history);

    // All three should collapse into one key
    expect(affinity.size).toBe(1);
    expect(affinity.get('worship')).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// scoreContent
// ---------------------------------------------------------------------------

describe('scoreContent', () => {
  it('popular content scores higher on popularity component', () => {
    const maxViews = 10000;
    const emptyAffinity = new Map<string, number>();

    const popular = scoreContent(candidates[4], emptyAffinity, maxViews, nowMs); // 10000 views
    const unpopular = scoreContent(candidates[3], emptyAffinity, maxViews, nowMs); // 200 views

    // Popularity weight is 0.4; popular item should score significantly higher
    expect(popular.score).toBeGreaterThan(unpopular.score);
  });

  it('content with matching tags scores higher on tag affinity component', () => {
    const maxViews = 10000;
    const tagAffinity = new Map<string, number>([
      ['worship', 1.0],
      ['live', 0.5],
    ]);

    // Candidate 1 has tags ['worship', 'live', 'music'] — 2 matches
    const matched = scoreContent(candidates[0], tagAffinity, maxViews, nowMs);
    // Candidate 3 has tags ['outreach', 'community'] — 0 matches
    const unmatched = scoreContent(candidates[2], tagAffinity, maxViews, nowMs);

    expect(matched.score).toBeGreaterThan(unmatched.score);
  });

  it('fresh content scores higher on freshness component', () => {
    const maxViews = 10000;
    const emptyAffinity = new Map<string, number>();

    // Candidate 1: 2 days old (very fresh)
    const fresh = scoreContent(candidates[0], emptyAffinity, maxViews, nowMs);
    // Candidate 3: 60 days old (less fresh)
    const stale = scoreContent(candidates[2], emptyAffinity, maxViews, nowMs);

    // Freshness weight is 0.2; combined with other factors, fresh should score higher
    // (candidate 1 also has more views, reinforcing this)
    expect(fresh.score).toBeGreaterThan(stale.score);
  });

  it('old content (>90 days) gets 0 freshness score', () => {
    const maxViews = 10000;
    const emptyAffinity = new Map<string, number>();

    // Candidate 4: 120 days old
    const result = scoreContent(candidates[3], emptyAffinity, maxViews, nowMs);

    // With 200 views out of 10000 → popularity = 0.02
    // freshness = 0 (>90 days)
    // tagScore = 0 (empty affinity)
    // similarity component = 0.1 * 0.5 = 0.05
    // score = 0.4 * 0.02 + 0.3 * 0 + 0.2 * 0 + 0.05 = 0.058
    expect(result.score).toBeCloseTo(0.4 * (200 / 10000) + 0.05, 5);
  });
});

// ---------------------------------------------------------------------------
// generateRecommendations
// ---------------------------------------------------------------------------

describe('generateRecommendations', () => {
  it('filters out already-watched content', () => {
    const history = [
      { title: 'Worship Night Live', contentType: 'media', tags: ['worship'] },
    ];

    const recs = generateRecommendations(candidates, history, 10);

    const titles = recs.map((r) => r.title);
    expect(titles).not.toContain('Worship Night Live');
  });

  it('returns at most `limit` results', () => {
    const recs = generateRecommendations(candidates, [], 2);
    expect(recs.length).toBe(2);
  });

  it('results are sorted by score descending', () => {
    const recs = generateRecommendations(candidates, [], 10);

    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
    }
  });

  it('personalized scores differ from popularity-only', () => {
    const history = [
      { title: 'X', contentType: 'media', tags: ['outreach', 'community'] },
      { title: 'Y', contentType: 'media', tags: ['outreach', 'community'] },
      { title: 'Z', contentType: 'media', tags: ['outreach'] },
    ];

    const personalized = generateRecommendations(candidates, history, 5);
    const popular = popularityRecommendations(candidates, 5);

    // The ordering should differ because tag affinity boosts 'outreach'/'community' content
    const personalizedOrder = personalized.map((r) => r.contentId);
    const popularOrder = popular.map((r) => r.contentId);

    expect(personalizedOrder).not.toEqual(popularOrder);
  });
});

// ---------------------------------------------------------------------------
// popularityRecommendations
// ---------------------------------------------------------------------------

describe('popularityRecommendations', () => {
  it('sorts by views descending', () => {
    const recs = popularityRecommendations(candidates, 10);

    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].metadata.views!).toBeGreaterThanOrEqual(
        recs[i].metadata.views!
      );
    }
  });

  it('most viewed item has score = 1.0', () => {
    const recs = popularityRecommendations(candidates, 10);

    // First item should be the most viewed with score 1.0
    expect(recs[0].score).toBe(1.0);
    expect(recs[0].title).toBe('Most Popular Sermon');
  });

  it('returns at most `limit` results', () => {
    const recs = popularityRecommendations(candidates, 3);
    expect(recs.length).toBe(3);
  });
});
