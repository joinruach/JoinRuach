'use client';

import { useState } from 'react';

export default function ApprovalActions({
  needsManualReview,
  isProcessing,
  onApprove,
  onCorrect,
}: {
  needsManualReview: boolean;
  isProcessing: boolean;
  onApprove: (notes?: string) => void;
  onCorrect: (notes?: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const handleSubmit = () => {
    if (needsManualReview) {
      onCorrect(notes || undefined);
    } else {
      onApprove(notes || undefined);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {needsManualReview ? 'Save Manual Corrections' : 'Approve Sync'}
      </h2>

      {/* Notes (optional) */}
      <div className="mb-4">
        <button
          onClick={() => setShowNotesInput(!showNotesInput)}
          className="text-sm text-ruachGold hover:underline"
        >
          {showNotesInput ? '− Hide notes' : '+ Add notes (optional)'}
        </button>

        {showNotesInput && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Add any notes about this sync review..."
          />
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          needsManualReview
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
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
            Processing...
          </span>
        ) : needsManualReview ? (
          '✓ Save Manual Corrections & Continue'
        ) : (
          '✓ Approve Sync & Continue'
        )}
      </button>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center">
        {needsManualReview
          ? 'Your manual adjustments will be saved and applied to the session'
          : 'This will mark the sync as approved and move to the next stage'}
      </p>
    </div>
  );
}
