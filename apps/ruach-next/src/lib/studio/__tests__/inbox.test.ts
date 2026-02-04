/**
 * Inbox Logic Tests
 *
 * Unit tests for inbox aggregation and filtering logic.
 */

import { describe, it, expect } from 'vitest';
import {
  filterInboxItems,
  calculateQueueStats,
} from '../inbox';
import { generateMockInboxItems } from '../mockData';

describe('Inbox Logic', () => {
  describe('filterInboxItems', () => {
    it('should filter by status', () => {
      const items = generateMockInboxItems(10);
      const filtered = filterInboxItems(items, { status: ['failed'] });

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((item) => item.status === 'failed')).toBe(true);
    });

    it('should filter by priority', () => {
      const items = generateMockInboxItems(10);
      const filtered = filterInboxItems(items, { priority: ['urgent', 'high'] });

      expect(filtered.length).toBeGreaterThan(0);
      expect(
        filtered.every(
          (item) => item.priority === 'urgent' || item.priority === 'high'
        )
      ).toBe(true);
    });

    it('should filter by category', () => {
      const items = generateMockInboxItems(10);
      const filtered = filterInboxItems(items, { category: ['render'] });

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((item) => item.category === 'render')).toBe(true);
    });

    it('should search by title', () => {
      const items = generateMockInboxItems(10);
      const filtered = filterInboxItems(items, { search: 'Render' });

      expect(filtered.length).toBeGreaterThan(0);
      expect(
        filtered.every((item) => item.title.toLowerCase().includes('render'))
      ).toBe(true);
    });

    it('should combine multiple filters', () => {
      const items = generateMockInboxItems(20);
      const filtered = filterInboxItems(items, {
        status: ['failed'],
        priority: ['urgent'],
      });

      expect(
        filtered.every(
          (item) => item.status === 'failed' && item.priority === 'urgent'
        )
      ).toBe(true);
    });

    it('should return all items when no filters applied', () => {
      const items = generateMockInboxItems(10);
      const filtered = filterInboxItems(items, {});

      expect(filtered.length).toBe(items.length);
    });
  });

  describe('calculateQueueStats', () => {
    it('should calculate correct total', () => {
      const items = generateMockInboxItems(15);
      const stats = calculateQueueStats(items);

      expect(stats.total).toBe(15);
    });

    it('should count urgent items', () => {
      const items = generateMockInboxItems(20);
      const urgentCount = items.filter((i) => i.priority === 'urgent').length;
      const stats = calculateQueueStats(items);

      expect(stats.urgent).toBe(urgentCount);
    });

    it('should count items needing review', () => {
      const items = generateMockInboxItems(20);
      const reviewCount = items.filter((i) => i.status === 'reviewing').length;
      const stats = calculateQueueStats(items);

      expect(stats.needsReview).toBe(reviewCount);
    });

    it('should count failed items', () => {
      const items = generateMockInboxItems(20);
      const failedCount = items.filter((i) => i.status === 'failed').length;
      const stats = calculateQueueStats(items);

      expect(stats.failed).toBe(failedCount);
    });

    it('should count processing items', () => {
      const items = generateMockInboxItems(20);
      const processingCount = items.filter(
        (i) =>
          i.status === 'processing' ||
          i.status === 'rendering' ||
          i.status === 'encoding'
      ).length;
      const stats = calculateQueueStats(items);

      expect(stats.processing).toBe(processingCount);
    });

    it('should break down by category', () => {
      const items = generateMockInboxItems(20);
      const stats = calculateQueueStats(items);

      const categoryTotal =
        stats.byCategory.ingest +
        stats.byCategory.edit +
        stats.byCategory.publish +
        stats.byCategory.render +
        stats.byCategory.library;

      expect(categoryTotal).toBe(items.length);
    });

    it('should break down by status', () => {
      const items = generateMockInboxItems(20);
      const stats = calculateQueueStats(items);

      const statusTotal = Object.values(stats.byStatus).reduce(
        (sum, count) => sum + count,
        0
      );

      expect(statusTotal).toBe(items.length);
    });
  });
});
