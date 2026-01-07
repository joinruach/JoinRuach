'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewData {
  versionId: string;
  sourceId: string;
  contentType: string;
  status: string;
  qaMetrics?: {
    totalWorks?: number;
    totalVerses?: number;
    validationPassed?: boolean;
    reviewStatus?: string;
  };
  reviewReport?: {
    summary: {
      totalWorks: number;
      totalVerses: number;
      testaments: Record<string, number>;
    };
    works: Array<{
      workId: string;
      canonicalName: string;
      testament: string;
      chapters: number;
      verses: number;
    }>;
  };
}

export default function ReviewCockpit({
  versionId,
  locale,
}: {
  versionId: string;
  locale: string;
}) {
  const router = useRouter();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviewData();
  }, [versionId]);

  const fetchReviewData = async () => {
    try {
      // In a real implementation, this would fetch from the review report API
      // For now, we'll simulate it
      const response = await fetch(`/api/ingestion/versions?versionId=${versionId}`);
      if (response.ok) {
        const data = await response.json();
        setReviewData(data.version);
      }
    } catch (error) {
      console.error('Failed to fetch review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    await submitReview('approved');
  };

  const handleReject = async () => {
    await submitReview('rejected');
  };

  const handleNeedsReview = async () => {
    await submitReview('needs_review');
  };

  const submitReview = async (action: 'approved' | 'rejected' | 'needs_review') => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/ingestion/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          action,
          notes,
          reviewData: {
            selectedWork,
            spotCheckedVerses: selectedVerses.length,
          },
        }),
      });

      if (response.ok) {
        router.push(`/${locale}/studio/ingestion?status=reviewing`);
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ruachGold"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading review data...</p>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Review data not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900">
      {/* Left Column: Summary & Works List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {reviewData.qaMetrics && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Works:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {reviewData.qaMetrics.totalWorks || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Verses:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {reviewData.qaMetrics.totalVerses?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Validation:</span>
                <span
                  className={`text-sm font-medium ${
                    reviewData.qaMetrics.validationPassed
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {reviewData.qaMetrics.validationPassed ? '✅ Passed' : '❌ Failed'}
                </span>
              </div>
            </div>
          )}

          {reviewData.reviewReport && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Works</h3>
              <div className="space-y-2">
                {reviewData.reviewReport.works.map((work) => (
                  <button
                    key={work.workId}
                    onClick={() => setSelectedWork(work.workId)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      selectedWork === work.workId
                        ? 'bg-ruachGold text-ruachDark'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium">{work.canonicalName}</div>
                    <div className="text-xs opacity-75">
                      {work.chapters} chapters, {work.verses} verses
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Column: Verse Review */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Verse Review</h2>
          {selectedWork && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Reviewing verses for selected work
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedWork ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Spot-check verses here. In a full implementation, this would load and display actual
                verse data from the extraction output.
              </p>
              {/* Placeholder for verse display */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Verse display would go here
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <p>Select a work from the left to review verses</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Review Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Actions</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              placeholder="Add notes about quality, issues found, spot-check results..."
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Approve & Import
            </button>
            <button
              onClick={handleNeedsReview}
              disabled={submitting}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⚠️ Needs Review
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ❌ Reject
            </button>
          </div>

          {submitting && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Submitting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
