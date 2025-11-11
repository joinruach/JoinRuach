/**
 * Content recommendation engine
 * Combines content-based filtering (embeddings) with user history
 */

export interface UserInteraction {
  contentType: string;
  contentId: number;
  interactionType: 'view' | 'complete' | 'like' | 'bookmark';
  durationSec?: number;
  completed?: boolean;
  createdAt: Date;
}

export interface RecommendedContent {
  contentType: string;
  contentId: number;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  score: number;
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Calculate recommendation score based on user interactions
 * Returns a weighted score indicating user interest level
 */
export function calculateUserInterest(interactions: UserInteraction[]): number {
  if (interactions.length === 0) return 0;

  const weights = {
    view: 1,
    complete: 3,
    like: 2,
    bookmark: 2,
  };

  const totalScore = interactions.reduce((sum, interaction) => {
    let score = weights[interaction.interactionType] || 1;

    // Bonus for completed content
    if (interaction.completed) {
      score *= 1.5;
    }

    // Bonus for recently viewed (decay over time)
    const daysSince = (Date.now() - interaction.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0.5, 1 - daysSince / 30); // Decay over 30 days
    score *= recencyBonus;

    return sum + score;
  }, 0);

  return totalScore / interactions.length; // Normalize
}

/**
 * Generate reason for recommendation
 */
export function generateRecommendationReason(
  item: { contentType: string; title: string },
  basis: {
    similarTo?: string;
    basedOnHistory?: boolean;
    popular?: boolean;
    tags?: string[];
  }
): string {
  if (basis.similarTo) {
    return `Similar to "${basis.similarTo}"`;
  }

  if (basis.basedOnHistory) {
    if (basis.tags && basis.tags.length > 0) {
      return `Based on your interest in ${basis.tags.slice(0, 2).join(' and ')}`;
    }
    return 'Based on your viewing history';
  }

  if (basis.popular) {
    return 'Popular with Ruach community';
  }

  return 'Recommended for you';
}

/**
 * Merge and rank recommendations from multiple sources
 */
export function mergeRecommendations(
  contentBased: RecommendedContent[],
  collaborative: RecommendedContent[],
  options: {
    contentWeight?: number;
    collaborativeWeight?: number;
    diversify?: boolean;
  } = {}
): RecommendedContent[] {
  const contentWeight = options.contentWeight ?? 0.6;
  const collaborativeWeight = options.collaborativeWeight ?? 0.4;

  // Create a map to merge duplicates
  const itemMap = new Map<string, RecommendedContent>();

  // Add content-based recommendations
  contentBased.forEach(item => {
    const key = `${item.contentType}-${item.contentId}`;
    itemMap.set(key, {
      ...item,
      score: item.score * contentWeight,
    });
  });

  // Add collaborative recommendations
  collaborative.forEach(item => {
    const key = `${item.contentType}-${item.contentId}`;
    const existing = itemMap.get(key);

    if (existing) {
      // Boost items that appear in both
      existing.score += item.score * collaborativeWeight;
      existing.reason = `${existing.reason} & ${item.reason}`;
    } else {
      itemMap.set(key, {
        ...item,
        score: item.score * collaborativeWeight,
      });
    }
  });

  // Convert to array and sort
  let recommendations = Array.from(itemMap.values()).sort((a, b) => b.score - a.score);

  // Optionally diversify by content type
  if (options.diversify) {
    recommendations = diversifyByContentType(recommendations);
  }

  return recommendations;
}

/**
 * Ensure diversity of content types in recommendations
 * Prevents all recommendations from being the same type
 */
function diversifyByContentType(recommendations: RecommendedContent[]): RecommendedContent[] {
  const diversified: RecommendedContent[] = [];
  const typeCount = new Map<string, number>();

  for (const item of recommendations) {
    const count = typeCount.get(item.contentType) || 0;

    // Allow max 3 items of same type in a row
    if (count < 3 || diversified.length >= recommendations.length - 3) {
      diversified.push(item);
      typeCount.set(item.contentType, count + 1);
    }
  }

  // Add remaining items if we filtered too aggressively
  if (diversified.length < Math.min(10, recommendations.length)) {
    recommendations.forEach(item => {
      if (!diversified.includes(item)) {
        diversified.push(item);
      }
    });
  }

  return diversified;
}

/**
 * Filter out content user has already seen
 */
export function filterViewedContent(
  recommendations: RecommendedContent[],
  viewedItems: Array<{ contentType: string; contentId: number }>
): RecommendedContent[] {
  const viewedSet = new Set(viewedItems.map(v => `${v.contentType}-${v.contentId}`));

  return recommendations.filter(item => {
    const key = `${item.contentType}-${item.contentId}`;
    return !viewedSet.has(key);
  });
}
