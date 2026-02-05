"use strict";
/**
 * Inbox Aggregation Logic
 *
 * Centralized inbox that pulls attention items from all workflows:
 * - Ingestion (failed uploads, pending reviews)
 * - Render (failed jobs, queued jobs)
 * - Publishing (scheduled, failed publishes)
 * - Edit (pending EDL approvals)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterInboxItems = exports.calculateQueueStats = exports.fetchInboxItems = void 0;
/**
 * Priority order for sorting (lower = higher priority)
 */
var PRIORITY_ORDER = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
};
/**
 * Fetch ingestion inbox items
 * Calls Strapi directly with JWT (more efficient than HTTP hop through /api)
 */
function fetchIngestionInbox(jwt) {
    return __awaiter(this, void 0, void 0, function () {
        var strapiUrl, response, data, versions, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
                    return [4 /*yield*/, fetch("".concat(strapiUrl, "/api/ingestion/versions"), {
                            cache: 'no-store',
                            headers: {
                                Authorization: "Bearer ".concat(jwt),
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        console.error('[Inbox] Failed to fetch ingestion versions:', response.status);
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    versions = data.versions || [];
                    return [2 /*return*/, versions
                            .filter(function (v) {
                            return v.status === 'reviewing' || v.status === 'failed' || v.status === 'pending';
                        })
                            .map(function (version) { return ({
                            id: "ingest-".concat(version.versionId),
                            category: 'ingest',
                            entityType: 'upload',
                            entityId: version.versionId,
                            title: "Ingestion: ".concat(version.contentType),
                            subtitle: version.sourceId,
                            thumbnailUrl: undefined,
                            icon: version.contentType === 'scripture' ? '📖' : version.contentType === 'canon' ? '📚' : '📗',
                            status: version.status,
                            priority: version.status === 'failed'
                                ? 'urgent'
                                : version.status === 'reviewing'
                                    ? 'high'
                                    : 'normal',
                            reason: version.status === 'failed'
                                ? 'Ingestion failed and needs attention'
                                : version.status === 'reviewing'
                                    ? 'Ready for operator review'
                                    : 'Ingestion pending',
                            availableActions: version.status === 'reviewing'
                                ? ['review', 'approve', 'reject']
                                : version.status === 'failed'
                                    ? ['retry', 'cancel']
                                    : ['review'],
                            primaryAction: version.status === 'reviewing' ? 'approve' : 'review',
                            createdAt: version.createdAt,
                            updatedAt: version.completedAt || version.createdAt,
                        }); })];
                case 3:
                    error_1 = _a.sent();
                    console.error('[Inbox] Error fetching ingestion inbox:', error_1);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Fetch render inbox items
 * Note: Render jobs API requires session IDs, so we only return failed/queued jobs for now
 * Full implementation will come in Phase 3 with a dedicated render jobs list endpoint
 */
function fetchRenderInbox(jwt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // For Phase 2, we'll return empty array until we have a render jobs list API
            // Phase 3 will add: GET /api/render-job/render-jobs (list all jobs)
            // For now, individual session render jobs are accessible via /api/render-job/render-jobs/session/:id
            return [2 /*return*/, []];
        });
    });
}
/**
 * Fetch publishing inbox items
 * TODO: Wire to actual publishing API in Phase 5
 */
function fetchPublishInbox(jwt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Mock implementation - replace with actual API call in Phase 5
            return [2 /*return*/, []];
        });
    });
}
/**
 * Fetch edit decision inbox items
 * TODO: Wire to actual EDL API in Phase 5
 */
function fetchEditInbox(jwt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Mock implementation - replace with actual API call in Phase 5
            return [2 /*return*/, []];
        });
    });
}
/**
 * Main inbox aggregation function
 * Fetches items from all workflows in parallel and sorts by priority
 *
 * @param jwt - Strapi JWT token for authentication
 * @returns Prioritized array of inbox items
 */
function fetchInboxItems(jwt) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, ingestionItems, renderItems, publishItems, editItems, items;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        fetchIngestionInbox(jwt),
                        fetchRenderInbox(jwt),
                        fetchPublishInbox(jwt),
                        fetchEditInbox(jwt),
                    ])];
                case 1:
                    _a = _b.sent(), ingestionItems = _a[0], renderItems = _a[1], publishItems = _a[2], editItems = _a[3];
                    items = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], ingestionItems, true), renderItems, true), publishItems, true), editItems, true);
                    // Sort by priority, then by date (newest first)
                    return [2 /*return*/, items.sort(function (a, b) {
                            var priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
                            if (priorityDiff !== 0)
                                return priorityDiff;
                            // If same priority, sort by date
                            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                        })];
            }
        });
    });
}
exports.fetchInboxItems = fetchInboxItems;
/**
 * Calculate queue statistics from inbox items
 *
 * @param items - Array of inbox items
 * @returns Queue statistics object
 */
function calculateQueueStats(items) {
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
        // Priority counts
        if (item.priority === 'urgent')
            stats.urgent++;
        // Status counts
        if (item.status === 'reviewing')
            stats.needsReview++;
        if (item.status === 'failed')
            stats.failed++;
        if (item.status === 'processing' || item.status === 'rendering' || item.status === 'encoding') {
            stats.processing++;
        }
        // Category counts
        stats.byCategory[item.category]++;
        // Status breakdown
        stats.byStatus[item.status]++;
    }
    return stats;
}
exports.calculateQueueStats = calculateQueueStats;
/**
 * Filter inbox items by criteria
 *
 * @param items - Array of inbox items
 * @param filters - Filter criteria
 * @returns Filtered array of inbox items
 */
function filterInboxItems(items, filters) {
    var filtered = __spreadArray([], items, true);
    if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(function (item) { return filters.status.includes(item.status); });
    }
    if (filters.priority && filters.priority.length > 0) {
        filtered = filtered.filter(function (item) { return filters.priority.includes(item.priority); });
    }
    if (filters.category && filters.category.length > 0) {
        filtered = filtered.filter(function (item) { return filters.category.includes(item.category); });
    }
    if (filters.search) {
        var searchLower_1 = filters.search.toLowerCase();
        filtered = filtered.filter(function (item) {
            var _a;
            return item.title.toLowerCase().includes(searchLower_1) ||
                ((_a = item.subtitle) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchLower_1)) ||
                item.reason.toLowerCase().includes(searchLower_1);
        });
    }
    return filtered;
}
exports.filterInboxItems = filterInboxItems;
