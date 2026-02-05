'use client';

import { useState } from 'react';
import type { SessionFormData } from './SessionCreateWizard';
import type { CameraAngle } from '@/lib/studio';

export default function SessionMetadataForm({
  data,
  onUpdate,
  onNext,
}: {
  data: Partial<SessionFormData>;
  onUpdate: (updates: Partial<SessionFormData>) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!data.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!data.recordingDate) {
      newErrors.recordingDate = 'Recording date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Session Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={data.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="e.g., Sunday Service - December 1st"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Recording Date */}
      <div>
        <label
          htmlFor="recordingDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Recording Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="recordingDate"
          value={
            data.recordingDate
              ? data.recordingDate.toISOString().split('T')[0]
              : ''
          }
          onChange={(e) =>
            onUpdate({ recordingDate: new Date(e.target.value) })
          }
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        {errors.recordingDate && (
          <p className="mt-1 text-sm text-red-500">{errors.recordingDate}</p>
        )}
      </div>

      {/* Event Type */}
      <div>
        <label
          htmlFor="eventType"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Event Type
        </label>
        <select
          id="eventType"
          value={data.eventType || 'service'}
          onChange={(e) =>
            onUpdate({
              eventType: e.target.value as
                | 'service'
                | 'teaching'
                | 'podcast'
                | 'other',
            })
          }
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="service">Service</option>
          <option value="teaching">Teaching</option>
          <option value="podcast">Podcast</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Anchor Camera */}
      <div>
        <label
          htmlFor="anchorAngle"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Master Camera (Sync Reference)
        </label>
        <select
          id="anchorAngle"
          value={data.anchorAngle || 'A'}
          onChange={(e) =>
            onUpdate({ anchorAngle: e.target.value as CameraAngle })
          }
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="A">Camera A (Wide)</option>
          <option value="B">Camera B (Medium)</option>
          <option value="C">Camera C (Close)</option>
        </select>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Other cameras will be synced to this master camera
        </p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          rows={4}
          value={data.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          placeholder="Add notes about this recording session..."
        />
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Continue to Upload →
        </button>
      </div>
    </form>
  );
}
