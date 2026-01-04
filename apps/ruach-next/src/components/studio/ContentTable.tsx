'use client';

import Link from 'next/link';
import Image from 'next/image';
import { imgUrl } from '@/lib/strapi';
import StatusBadge from './StatusBadge';
import type { MediaItemEntity } from '@/lib/types/strapi-types';

interface ContentTableProps {
  items: MediaItemEntity[];
  locale: string;
  onDelete?: (id: number) => void;
}

export default function ContentTable({ items, locale, onDelete }: ContentTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-6xl mb-4">📭</div>
        <p>No content found. Try adjusting your filters or upload new content.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Content
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Released
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => {
            const title = item.attributes?.title || 'Untitled';
            const thumbnail = item.attributes?.thumbnail?.data?.attributes?.url;
            const thumbnailSrc = thumbnail ? imgUrl(thumbnail) : null;
            const isPublished = Boolean(item.attributes?.releasedAt);
            const contentType = item.attributes?.type || 'unknown';
            const releasedAt = item.attributes?.releasedAt;

            return (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {thumbnailSrc ? (
                      <Image
                        src={thumbnailSrc}
                        alt={title}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl">
                        🎬
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate max-w-md">
                        {title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {item.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="capitalize text-sm text-gray-900 dark:text-white">
                    {contentType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={isPublished ? 'published' : 'draft'} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {releasedAt
                    ? new Date(releasedAt).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/${locale}/studio/content/${item.id}/edit`}
                      className="text-ruachGold hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/${locale}/media/${item.attributes?.slug}`}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                    >
                      View
                    </Link>
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this item?')) {
                            onDelete(item.id);
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
