"use strict";
/**
 * Studio Library Barrel Export
 *
 * Centralized exports for all studio workflow utilities.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMockStats = exports.generateMockItemDetail = exports.generateMockActivity = exports.generateMockInboxItems = exports.filterInboxItems = exports.calculateQueueStats = exports.fetchInboxItems = void 0;
// Inbox utilities
var inbox_1 = require("./inbox");
Object.defineProperty(exports, "fetchInboxItems", { enumerable: true, get: function () { return inbox_1.fetchInboxItems; } });
Object.defineProperty(exports, "calculateQueueStats", { enumerable: true, get: function () { return inbox_1.calculateQueueStats; } });
Object.defineProperty(exports, "filterInboxItems", { enumerable: true, get: function () { return inbox_1.filterInboxItems; } });
// Mock data (for testing only)
var mockData_1 = require("./mockData");
Object.defineProperty(exports, "generateMockInboxItems", { enumerable: true, get: function () { return mockData_1.generateMockInboxItems; } });
Object.defineProperty(exports, "generateMockActivity", { enumerable: true, get: function () { return mockData_1.generateMockActivity; } });
Object.defineProperty(exports, "generateMockItemDetail", { enumerable: true, get: function () { return mockData_1.generateMockItemDetail; } });
Object.defineProperty(exports, "generateMockStats", { enumerable: true, get: function () { return mockData_1.generateMockStats; } });
// ==========================================
// Phase 9-11: Multi-Camera Workflow
// ==========================================
// API utilities
__exportStar(require("./api"), exports);
__exportStar(require("./sessions"), exports);
__exportStar(require("./sync"), exports);
__exportStar(require("./transcript"), exports);
__exportStar(require("./edl"), exports);
