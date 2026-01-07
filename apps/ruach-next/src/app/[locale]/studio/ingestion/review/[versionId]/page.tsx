'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReviewCockpit from '@/components/studio/ReviewCockpit';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const versionId = params.versionId as string;
  const locale = params.locale as string;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review: {versionId}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manual QA review and approval
          </p>
        </div>
        <button
          onClick={() => router.push(`/${locale}/studio/ingestion`)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← Back to Inbox
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ReviewCockpit versionId={versionId} locale={locale} />
      </div>
    </div>
  );
}
