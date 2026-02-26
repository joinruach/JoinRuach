'use client';

/**
 * Operator Inbox Component
 *
 * Main inbox view for studio operators.
 * Aggregates items from all workflows and displays them in priority order.
 *
 * This is the primary landing page component that replaces the old dashboard.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QueueTable from './Queue/QueueTable';
import QueueFilters, { type FilterState } from './Queue/QueueFilters';
import { filterInboxItems } from '@/lib/studio/inbox';
import type { InboxItem } from '@/lib/studio/types';

interface OperatorInboxProps {
  items: InboxItem[];
  locale: string;
}

/**
 * Get detail page URL for an inbox item
 */
function getItemDetailUrl(item: InboxItem, locale: string): string {
  switch (item.category) {
    case 'ingest':
      // Review page for ingestion items
      return `/${locale}/studio/ingestion/review/${item.entityId}`;
    case 'render':
      // Render job detail page
      return `/${locale}/studio/renders/${item.entityId}`;
    case 'publish':
      // Publishing job detail (Phase 5)
      return `/${locale}/studio/publish/${item.entityId}`;
    case 'edit':
      // Edit decision detail (Phase 5)
      return `/${locale}/studio/edits/${item.entityId}`;
    case 'library':
      // Library content detail (Phase 5)
      return `/${locale}/studio/library/content/${item.entityId}`;
    default:
      return `/${locale}/studio`;
  }
}

export default function OperatorInbox({ items, locale }: OperatorInboxProps) {
  const router = useRouter();
  const [filteredItems, setFilteredItems] = useState<InboxItem[]>(items);

  const handleFilterChange = (filters: FilterState) => {
    const filtered = filterInboxItems(items, {
      status: filters.status,
      priority: filters.priority,
      category: filters.category,
      search: filters.search,
    });
    setFilteredItems(filtered);
  };

  const handleAction = async (itemId: string, action: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Navigation actions — go to detail page
    if (action === 'review' || action === 'edit') {
      router.push(getItemDetailUrl(item, locale));
      return;
    }

    // Mutation actions — call API then refresh
    try {
      if (action === 'retry') {
        if (item.category === 'publish') {
          await fetch(`/api/publishing/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'retry', entityId: item.entityId }),
          });
        } else if (item.category === 'ingest') {
          await fetch(`/api/ingestion/retry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ versionId: item.entityId }),
          });
        }
      } else if (action === 'cancel') {
        await fetch(`/api/ingestion/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityId: item.entityId, category: item.category }),
        });
      } else if (action === 'approve' || action === 'reject') {
        await fetch(`/api/ingestion/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versionId: item.entityId, decision: action }),
        });
      }

      router.refresh();
    } catch (error) {
      console.error(`[OperatorInbox] Action "${action}" failed for ${itemId}:`, error);
      // Navigate to detail page as fallback so user can act manually
      router.push(getItemDetailUrl(item, locale));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <QueueFilters
        onFilterChange={handleFilterChange}
        showSearch={true}
        showStatus={true}
        showPriority={true}
        showCategory={true}
      />

      {/* Queue Table */}
      <QueueTable
        items={filteredItems}
        locale={locale}
        columns={['thumbnail', 'title', 'status', 'priority', 'reason', 'updated', 'actions']}
        onAction={handleAction}
        emptyMessage="No items need attention right now. Great work!"
        emptyIcon="✅"
      />

      {/* Footer hint */}
      {filteredItems.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          Showing {filteredItems.length} of {items.length} items
        </div>
      )}
    </div>
  );
}
