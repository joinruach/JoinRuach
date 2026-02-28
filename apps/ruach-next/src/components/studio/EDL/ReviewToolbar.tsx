'use client';

import type { Cut } from '@/lib/studio/edl';

interface ReviewToolbarProps {
  cuts: Cut[];
  onApproveHighConfidence: () => void;
  onSelectNextLowConfidence: () => void;
}

function countByConfidence(cuts: Cut[]): {
  high: number;
  medium: number;
  low: number;
} {
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const cut of cuts) {
    const c = cut.confidence ?? 0;
    if (c >= 0.8) high++;
    else if (c >= 0.5) medium++;
    else low++;
  }

  return { high, medium, low };
}

export function ReviewToolbar({
  cuts,
  onApproveHighConfidence,
  onSelectNextLowConfidence,
}: ReviewToolbarProps) {
  const counts = countByConfidence(cuts);
  const hasLowConfidence = counts.low > 0;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 border-b border-gray-700">
      <span className="text-sm text-gray-400">Review:</span>

      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
          {counts.high} high
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
          {counts.medium} medium
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
          {counts.low} low
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onApproveHighConfidence}
          disabled={counts.high === 0}
          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Approve All Green
        </button>
        <button
          onClick={onSelectNextLowConfidence}
          disabled={!hasLowConfidence}
          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next Low Confidence
        </button>
      </div>
    </div>
  );
}
