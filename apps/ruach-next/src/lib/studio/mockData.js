"use strict";
/**
 * Mock Data for Studio Workflows
 *
 * Used for testing and Storybook stories during Phase 1.
 * Will be replaced with actual API calls in later phases.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMockStats = exports.generateMockItemDetail = exports.generateMockActivity = exports.generateMockInboxItems = void 0;
/**
 * Generate mock inbox items for testing
 */
function generateMockInboxItems(count) {
    if (count === void 0) { count = 10; }
    var items = [];
    var now = Date.now();
    var statuses = ['pending', 'reviewing', 'failed', 'queued', 'rendering'];
    var priorities = ['urgent', 'high', 'normal', 'low'];
    var categories = ['ingest', 'render', 'publish', 'edit'];
    for (var i = 0; i < count; i++) {
        var category = categories[i % categories.length];
        var status_1 = statuses[i % statuses.length];
        var priority = priorities[i % priorities.length];
        items.push({
            id: "mock-".concat(i),
            category: category,
            entityType: category === 'ingest' ? 'upload' : 'render-job',
            entityId: 1000 + i,
            title: "".concat(category === 'ingest' ? 'Upload' : 'Render Job', " ").concat(1000 + i),
            subtitle: "Test ".concat(category, " workflow item"),
            thumbnailUrl: undefined,
            icon: category === 'ingest' ? '📥' : '🎞️',
            status: status_1,
            priority: priority,
            reason: getReasonForStatus(status_1, category),
            availableActions: getActionsForStatus(status_1),
            primaryAction: getPrimaryAction(status_1),
            createdAt: new Date(now - i * 3600000).toISOString(),
            updatedAt: new Date(now - i * 1800000).toISOString(),
            lastActivityAt: new Date(now - i * 900000).toISOString(),
        });
    }
    return items;
}
exports.generateMockInboxItems = generateMockInboxItems;
/**
 * Get appropriate reason message for status
 */
function getReasonForStatus(status, category) {
    var reasons = {
        pending: "Waiting for ".concat(category, " to start"),
        reviewing: 'Requires operator review and approval',
        failed: 'Process failed and needs retry or investigation',
        queued: 'Waiting in queue for processing',
        rendering: 'Currently being processed',
    };
    return reasons[status] || 'Needs attention';
}
/**
 * Get available actions for status
 */
function getActionsForStatus(status) {
    var actions = {
        pending: ['review', 'cancel'],
        reviewing: ['approve', 'reject'],
        failed: ['retry', 'cancel'],
        queued: ['cancel'],
        rendering: ['cancel'],
    };
    return actions[status] || ['review'];
}
/**
 * Get primary action for status
 */
function getPrimaryAction(status) {
    var primary = {
        pending: 'review',
        reviewing: 'approve',
        failed: 'retry',
        queued: 'review',
        rendering: 'review',
    };
    return primary[status] || 'review';
}
/**
 * Generate mock workflow activity history
 */
function generateMockActivity(count) {
    if (count === void 0) { count = 5; }
    var activities = [];
    var now = Date.now();
    var actions = [
        'created',
        'status_changed',
        'review',
        'approve',
        'retry',
    ];
    for (var i = 0; i < count; i++) {
        activities.push({
            id: "activity-".concat(i),
            timestamp: new Date(now - i * 3600000).toISOString(),
            actor: i % 2 === 0 ? 'system' : 'user-123',
            action: actions[i % actions.length],
            details: "Mock activity ".concat(i),
        });
    }
    return activities;
}
exports.generateMockActivity = generateMockActivity;
/**
 * Generate mock workflow item detail
 */
function generateMockItemDetail(id) {
    var item = generateMockInboxItems(1)[0];
    return __assign(__assign({}, item), { id: id, description: 'This is a mock workflow item for testing purposes.', history: generateMockActivity(5), metadata: {
            uploadedBy: 'user-123',
            fileSize: 1024 * 1024 * 100, // 100MB
            duration: 3600, // 1 hour
        } });
}
exports.generateMockItemDetail = generateMockItemDetail;
/**
 * Generate mock queue stats
 */
function generateMockStats(items) {
    var stats = {
        total: items.length,
        urgent: 0,
        needsReview: 0,
        failed: 0,
        processing: 0,
        byCategory: {
            ingest: 0,
            edit: 0,
            publish: 0,
            render: 0,
            library: 0,
        },
        byStatus: {
            pending: 0,
            processing: 0,
            reviewing: 0,
            approved: 0,
            rejected: 0,
            queued: 0,
            rendering: 0,
            encoding: 0,
            uploading: 0,
            scheduled: 0,
            published: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
            archived: 0,
        },
    };
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        if (item.priority === 'urgent')
            stats.urgent++;
        if (item.status === 'reviewing')
            stats.needsReview++;
        if (item.status === 'failed')
            stats.failed++;
        if (item.status === 'processing' || item.status === 'rendering')
            stats.processing++;
        stats.byCategory[item.category]++;
        stats.byStatus[item.status]++;
    }
    return stats;
}
exports.generateMockStats = generateMockStats;
