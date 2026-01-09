'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function UploadPage() {
  const router = useRouter();
  const params = useParams();
  if (!params?.locale) {
    return null;
  }
  const locale = params.locale;
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    contentType: 'scripture',
    sourceId: 'scr:yahscriptures',
    testament: 'all',
    preserveFormatting: true,
    validateCanonical: true,
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('contentType', formData.contentType);
      uploadFormData.append('sourceId', formData.sourceId);
      uploadFormData.append('testament', formData.testament);
      uploadFormData.append('preserveFormatting', String(formData.preserveFormatting));
      uploadFormData.append('validateCanonical', String(formData.validateCanonical));

      const response = await fetch('/api/ingestion/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      router.push(`/${locale}/studio/ingestion?versionId=${result.versionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Upload Content for Ingestion
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload PDF, EPUB, or DOCX files for processing and review.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow space-y-6">
        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content Type
          </label>
          <select
            value={formData.contentType}
            onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="scripture">Scripture</option>
            <option value="canon">Canon (EGW)</option>
            <option value="library">Library</option>
          </select>
        </div>

        {/* Source ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source ID
          </label>
          <input
            type="text"
            value={formData.sourceId}
            onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="scr:yahscriptures"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: scr:name, canon:book-slug, or lib:book-slug
          </p>
        </div>

        {/* Scripture-specific options */}
        {formData.contentType === 'scripture' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Testament
              </label>
              <select
                value={formData.testament}
                onChange={(e) => setFormData({ ...formData, testament: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="tanakh">Tanakh</option>
                <option value="renewed_covenant">Renewed Covenant</option>
                <option value="apocrypha">Apocrypha</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preserveFormatting}
                  onChange={(e) =>
                    setFormData({ ...formData, preserveFormatting: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Preserve formatting (poetry, line breaks)
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.validateCanonical}
                  onChange={(e) =>
                    setFormData({ ...formData, validateCanonical: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Validate against canonical structure
                </span>
              </label>
            </div>
          </>
        )}

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            File
          </label>
          <input
            type="file"
            accept=".pdf,.epub,.docx"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          {formData.file && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-ruachGold h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading || !formData.file}
            className="flex-1 px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload & Enqueue'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
