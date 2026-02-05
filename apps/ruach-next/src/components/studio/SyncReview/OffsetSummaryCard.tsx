import type { Session } from '@/lib/studio';
import {
  getSyncConfidenceLabel,
  getSyncConfidenceColor,
} from '@/lib/studio';

export default function OffsetSummaryCard({
  session,
  classifications,
  masterCamera,
}: {
  session: Session;
  classifications: Record<
    string,
    'looks-good' | 'review-suggested' | 'needs-manual-nudge'
  >;
  masterCamera: string;
}) {
  const offsets = session.syncOffsets_ms || {};
  const confidences = session.syncConfidence || {};

  // Get overall status
  const overallStatus = Object.values(classifications).every(
    (c) => c === 'looks-good'
  )
    ? 'looks-good'
    : Object.values(classifications).some((c) => c === 'needs-manual-nudge')
    ? 'needs-manual-nudge'
    : 'review-suggested';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sync Results Summary
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Master Camera: <span className="font-semibold">{masterCamera}</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Overall Status
          </div>
          <div
            className={`text-lg font-semibold ${getSyncConfidenceColor(
              overallStatus
            )}`}
          >
            {getSyncConfidenceLabel(overallStatus)}
          </div>
        </div>
      </div>

      {/* Camera Offsets Table */}
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Camera
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Offset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(offsets).map(([camera, offset]) => {
              const offsetValue = typeof offset === 'number' ? offset : 0;
              const confidence = confidences[camera] || 0;
              const classification = classifications[camera];

              return (
                <tr key={camera}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    Camera {camera}
                    {camera === masterCamera && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        (Master)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                    {offsetValue > 0 ? '+' : ''}
                    {offsetValue}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {confidence.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${getSyncConfidenceColor(
                        classification
                      )}`}
                    >
                      {getSyncConfidenceLabel(classification)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Confidence Scoring:</strong> Values ≥10 are excellent, 5-10
          suggest quick review, {"<"}5 require manual adjustment.
        </p>
      </div>
    </div>
  );
}
