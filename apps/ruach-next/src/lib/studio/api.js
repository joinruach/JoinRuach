"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapStrapiArray = exports.unwrapStrapiResponse = exports.pollUntil = exports.apiFetch = exports.ApiError = exports.SyncResultSchema = exports.AssetSchema = exports.SessionSchema = exports.CameraAngleSchema = exports.OperatorStatusSchema = exports.SessionStatusSchema = void 0;
var zod_1 = require("zod");
// ==========================================
// Zod Schemas for Type Safety
// ==========================================
exports.SessionStatusSchema = zod_1.z.enum([
    'draft',
    'ingesting',
    'needs-review',
    'syncing',
    'synced',
    'editing',
    'rendering',
    'published',
    'archived',
]);
exports.OperatorStatusSchema = zod_1.z.enum(['pending', 'approved', 'corrected']);
exports.CameraAngleSchema = zod_1.z.enum(['A', 'B', 'C']);
exports.SessionSchema = zod_1.z.object({
    id: zod_1.z.number(),
    documentId: zod_1.z.string().optional(),
    sessionId: zod_1.z.string(),
    title: zod_1.z.string(),
    status: exports.SessionStatusSchema,
    operatorStatus: exports.OperatorStatusSchema.optional(),
    syncOffsets_ms: zod_1.z.record(zod_1.z.number()).optional(),
    syncConfidence: zod_1.z.record(zod_1.z.number()).optional(),
    syncMethod: zod_1.z.enum(['audio-offset-finder', 'manual', 'timecode']).optional(),
    anchorAngle: exports.CameraAngleSchema.optional(),
    recordingDate: zod_1.z.string(), // ISO date string
    description: zod_1.z.string().optional(),
    durationMs: zod_1.z.number().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    publishedAt: zod_1.z.string().optional(),
});
exports.AssetSchema = zod_1.z.object({
    id: zod_1.z.number(),
    documentId: zod_1.z.string().optional(),
    assetId: zod_1.z.string(),
    angle: exports.CameraAngleSchema,
    filename: zod_1.z.string(),
    r2_key: zod_1.z.string().optional(),
    r2_proxy_url: zod_1.z.string().optional(),
    r2_mezzanine_url: zod_1.z.string().optional(),
    r2_audio_wav_url: zod_1.z.string().optional(),
    transcodingStatus: zod_1.z.enum(['pending', 'processing', 'complete', 'failed']).optional(),
    uploadStatus: zod_1.z.enum(['pending', 'uploading', 'complete', 'failed']).optional(),
    durationMs: zod_1.z.number().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.SyncResultSchema = zod_1.z.object({
    camera: exports.CameraAngleSchema,
    offsetMs: zod_1.z.number(),
    confidence: zod_1.z.number(), // standard_score from audio-offset-finder (not 0-1!)
    classification: zod_1.z.enum(['looks-good', 'review-suggested', 'needs-manual-nudge']),
});
// ==========================================
// API Error Handling
// ==========================================
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(status, message, details) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        _this.details = details;
        _this.name = 'ApiError';
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
function apiFetch(endpoint, options) {
    return __awaiter(this, void 0, void 0, function () {
        var authToken, schema, fetchOptions, baseUrl, url, response, errorDetails, _a, errorMessage, data, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    authToken = options.authToken, schema = options.schema, fetchOptions = __rest(options, ["authToken", "schema"]);
                    baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
                    if (!baseUrl) {
                        throw new Error('NEXT_PUBLIC_STRAPI_URL environment variable is not set');
                    }
                    url = "".concat(baseUrl).concat(endpoint);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, fetch(url, __assign(__assign({}, fetchOptions), { headers: __assign({ Authorization: "Bearer ".concat(authToken), 'Content-Type': 'application/json' }, fetchOptions.headers) }))];
                case 2:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 7];
                    errorDetails = void 0;
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, response.json()];
                case 4:
                    errorDetails = _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    errorDetails = { error: response.statusText };
                    return [3 /*break*/, 6];
                case 6:
                    errorMessage = typeof errorDetails === 'object' &&
                        errorDetails !== null &&
                        'error' in errorDetails
                        ? String(errorDetails.error)
                        : response.statusText || 'Unknown error';
                    throw new ApiError(response.status, errorMessage, errorDetails);
                case 7: return [4 /*yield*/, response.json()];
                case 8:
                    data = _b.sent();
                    // Validate with Zod if schema provided
                    if (schema) {
                        return [2 /*return*/, schema.parse(data)];
                    }
                    return [2 /*return*/, data];
                case 9:
                    error_1 = _b.sent();
                    if (error_1 instanceof ApiError) {
                        throw error_1;
                    }
                    if (error_1 instanceof zod_1.z.ZodError) {
                        throw new ApiError(500, 'Invalid response schema from API', error_1.issues);
                    }
                    throw new ApiError(500, error_1 instanceof Error ? error_1.message : 'Network error');
                case 10: return [2 /*return*/];
            }
        });
    });
}
exports.apiFetch = apiFetch;
function pollUntil(fn, condition, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var _a, maxAttempts, _b, interval, onProgress, attempt, result;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = options.maxAttempts, maxAttempts = _a === void 0 ? 30 : _a, _b = options.interval, interval = _b === void 0 ? 2000 : _b, onProgress = options.onProgress;
                    attempt = 1;
                    _c.label = 1;
                case 1:
                    if (!(attempt <= maxAttempts)) return [3 /*break*/, 5];
                    if (onProgress) {
                        onProgress(attempt);
                    }
                    return [4 /*yield*/, fn()];
                case 2:
                    result = _c.sent();
                    if (condition(result)) {
                        return [2 /*return*/, result];
                    }
                    if (!(attempt < maxAttempts)) return [3 /*break*/, 4];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, interval); })];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    attempt++;
                    return [3 /*break*/, 1];
                case 5: throw new Error("Polling timeout: condition not met after ".concat(maxAttempts, " attempts"));
            }
        });
    });
}
exports.pollUntil = pollUntil;
// ==========================================
// Strapi Response Normalization Helpers
// ==========================================
/**
 * Extract data from Strapi's wrapped response format
 * Handles both { data: {...} } and direct object returns
 */
function unwrapStrapiResponse(response) {
    if (response &&
        typeof response === 'object' &&
        'data' in response &&
        response.data) {
        return response.data;
    }
    return response;
}
exports.unwrapStrapiResponse = unwrapStrapiResponse;
/**
 * Extract array data from Strapi's wrapped response format
 * Handles both { data: [...] } and direct array returns
 */
function unwrapStrapiArray(response) {
    var data = unwrapStrapiResponse(response);
    return Array.isArray(data) ? data : [];
}
exports.unwrapStrapiArray = unwrapStrapiArray;
