'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, Asset } from '@/lib/studio';
import {
  classifySyncConfidence,
  approveSync,
  correctSync,
} from '@/lib/studio';
import OffsetSummaryCard from './OffsetSummaryCard';
import WaveformComparison from './WaveformComparison';
import ManualOffsetAdjuster from './ManualOffsetAdjuster';
import ApprovalActions from './ApprovalActions';

export default function SyncReviewCockpit({
  session,
  assets,
  authToken,
  locale,
}: {
  session: Session;
  assets: Asset[];
  authToken: string;
  locale: string;
}) {
  const router = useRouter();

  // Get master camera and comparison cameras
  const masterCamera = session.anchorAngle || 'A';
  const comparisonCameras = (['A', 'B', 'C'] as const).filter(
    (cam) => cam !== masterCamera
  );

  // Classify sync confidence for each camera
  const classifications = Object.fromEntries(
    Object.entries(session.syncConfidence || {}).map(([camera, confidence]) => [
      camera,
      classifySyncConfidence(confidence),
    ])
  );

  // Determine if any camera needs manual review
  const needsManualReview = Object.values(classifications).some(
    (classification) => classification !== 'looks-good'
  );

  // State for details expansion
  const [showDetails, setShowDetails] = useState(needsManualReview);

  // State for manual offset adjustments
  const [manualOffsets, setManualOffsets] = useState<Record<string, number>>(
    session.syncOffsets_ms || {}
  );

  // State for approval actions
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle approval
  const handleApprove = async (notes?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const sessionSlug = session.documentId || session.id.toString();
      await approveSync(sessionSlug, authToken, notes);
      router.push(`/${locale}/studio/sessions/${sessionSlug}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to approve sync'
      );
      setIsProcessing(false);
    }
  };

  // Handle manual correction
  const handleCorrect = async (notes?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const sessionSlug = session.documentId || session.id.toString();
      await correctSync(
        sessionSlug,
        manualOffsets,
        authToken,
        notes
      );
      router.push(`/${locale}/studio/sessions/${sessionSlug}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to correct sync'
      );
      setIsProcessing(false);
    }
  };

  // Get asset by camera angle
  const getAsset = (camera: string) =>
    assets.find((a) => a.angle === camera);

  const masterAsset = getAsset(masterCamera);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Offset Summary */}
      <OffsetSummaryCard
        session={session}
        classifications={classifications}
        masterCamera={masterCamera}
      />

      {/* Details Section (Collapsible) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Review Details
          </h2>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              showDetails ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showDetails && (
          <div className="px-6 pb-6 space-y-8">
            {/* Waveform Comparisons */}
            {comparisonCameras.map((camera) => {
              const comparisonAsset = getAsset(camera);
              if (!masterAsset || !comparisonAsset) return null;

              const offset = session.syncOffsets_ms?.[camera] || 0;
              const confidence = session.syncConfidence?.[camera] || 0;

              return (
                <div key={camera} className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    Camera {camera} vs Camera {masterCamera}
                  </h3>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Detected Offset:{' '}
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          {offset > 0 ? '+' : ''}
                          {offset}ms
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence:{' '}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {confidence.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {masterAsset.r2_audio_wav_url &&
                      comparisonAsset.r2_audio_wav_url && (
                        <WaveformComparison
                          masterAudioUrl={masterAsset.r2_audio_wav_url}
                          comparisonAudioUrl={comparisonAsset.r2_audio_wav_url}
                          offsetMs={manualOffsets[camera] || offset}
                          masterLabel={`Camera ${masterCamera}`}
                          comparisonLabel={`Camera ${camera}`}
                        />
                      )}
                  </div>
                </div>
              );
            })}

            {/* Manual Offset Adjuster */}
            {needsManualReview && (
              <ManualOffsetAdjuster
                cameras={comparisonCameras}
                offsets={manualOffsets}
                onUpdate={setManualOffsets}
              />
            )}
          </div>
        )}
      </div>

      {/* Approval Actions */}
      <ApprovalActions
        needsManualReview={needsManualReview}
        isProcessing={isProcessing}
        onApprove={handleApprove}
        onCorrect={handleCorrect}
      />
    </div>
  );
}
