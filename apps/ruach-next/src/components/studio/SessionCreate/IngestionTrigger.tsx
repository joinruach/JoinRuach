'use client';

import { useState } from 'react';
import type { SessionFormData } from './SessionCreateWizard';
import { createSession } from '@/lib/studio';

export default function IngestionTrigger({
  authToken,
  formData,
  onBack,
  onComplete,
}: {
  authToken: string;
  formData: SessionFormData;
  onBack: () => void;
  onComplete: (sessionId: number) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Validate asset IDs
      const assetIds = [
        formData.assetIds.A,
        formData.assetIds.B,
        formData.assetIds.C,
      ].filter((id): id is string => Boolean(id));

      if (assetIds.length !== 3) {
        throw new Error('All 3 camera angles must be uploaded');
      }

      // Create session
      const session = await createSession(
        {
          title: formData.title,
          recordingDate: formData.recordingDate,
          description: formData.description,
          speakers: formData.speakers,
          eventType: formData.eventType,
          anchorAngle: formData.anchorAngle,
          assets: assetIds,
        },
        authToken
      );

      // Success!
      onComplete(session.id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Session Summary
        </h3>

        <div className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Title
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {formData.title}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Recording Date
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {formData.recordingDate.toLocaleDateString()}
            </dd>
          </div>

          {formData.eventType && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Event Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                {formData.eventType}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Master Camera
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              Camera {formData.anchorAngle}
            </dd>
          </div>

          {formData.description && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Description
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {formData.description}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Camera Uploads
            </dt>
            <dd className="mt-1 space-y-1">
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Camera A uploaded
              </div>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Camera B uploaded
              </div>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Camera C uploaded
              </div>
            </dd>
          </div>
        </div>
      </div>

      {/* Next Steps Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          What happens next?
        </h4>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>Session will be created with status "ingesting"</li>
          <li>Videos will be transcoded to proxy & mezzanine formats</li>
          <li>Audio will be extracted as WAV files for sync analysis</li>
          <li>Once ready, you'll be prompted to review sync results</li>
        </ol>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          disabled={isCreating}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isCreating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating Session...
            </>
          ) : (
            'Create Session & Start Ingestion'
          )}
        </button>
      </div>
    </div>
  );
}
