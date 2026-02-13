"use strict";
/**
 * Cloudflare Workers API for IdeaLogs
 * Handles template persistence with D1 database
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var itty_router_1 = require("itty-router");
var router = (0, itty_router_1.Router)();
// CORS headers
var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
// Initialize database schema
var initDatabase = function (db) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db.exec("\n      CREATE TABLE IF NOT EXISTS templates (\n        id TEXT PRIMARY KEY,\n        name TEXT NOT NULL,\n        title TEXT NOT NULL,\n        xAxis TEXT NOT NULL,\n        yAxes TEXT NOT NULL,\n        chartType TEXT DEFAULT 'line',\n        strokeWidth INTEGER DEFAULT 2,\n        showGrid INTEGER DEFAULT 1,\n        showMinorGrid INTEGER DEFAULT 0,\n        xMin TEXT,\n        xMax TEXT,\n        yMin REAL,\n        yMax REAL,\n        xAxisLabel TEXT,\n        yAxisLabel TEXT,\n        xAxisType TEXT DEFAULT 'number',\n        sourceLogId TEXT,\n        savedAt TEXT NOT NULL,\n        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,\n        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP\n      );\n\n      CREATE INDEX IF NOT EXISTS idx_templates_createdAt ON templates(createdAt DESC);\n      CREATE INDEX IF NOT EXISTS idx_templates_sourceLogId ON templates(sourceLogId);\n    ")];
            case 1:
                _a.sent();
                console.log('Database schema initialized');
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Failed to initialize database:', error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// GET /api/templates - List all templates
router.get('/api/templates', function (request, env) { return __awaiter(void 0, void 0, void 0, function () {
    var results, templates, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, env.DB.prepare('SELECT * FROM templates ORDER BY createdAt DESC LIMIT 100').all()];
            case 1:
                results = (_a.sent()).results;
                templates = (results || []).map(function (row) { return ({
                    id: row.id,
                    name: row.name,
                    title: row.title,
                    xAxis: row.xAxis,
                    yAxes: JSON.parse(row.yAxes || '[]'),
                    chartType: row.chartType,
                    strokeWidth: row.strokeWidth,
                    showGrid: row.showGrid === 1,
                    showMinorGrid: row.showMinorGrid === 1,
                    xMin: row.xMin,
                    xMax: row.xMax,
                    yMin: row.yMin,
                    yMax: row.yMax,
                    xAxisLabel: row.xAxisLabel,
                    yAxisLabel: row.yAxisLabel,
                    xAxisType: row.xAxisType,
                    sourceLogId: row.sourceLogId,
                    savedAt: row.savedAt
                }); });
                return [2 /*return*/, new Response(JSON.stringify(templates), {
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        status: 200
                    })];
            case 2:
                error_2 = _a.sent();
                console.error('Failed to list templates:', error_2);
                return [2 /*return*/, new Response(JSON.stringify({ error: 'Failed to list templates' }), { headers: corsHeaders, status: 500 })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/templates/:id - Get single template
router.get('/api/templates/:id', function (request, env) { return __awaiter(void 0, void 0, void 0, function () {
    var id, result, template, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = request.params.id;
                return [4 /*yield*/, env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first()];
            case 1:
                result = _a.sent();
                if (!result) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Template not found' }), { headers: corsHeaders, status: 404 })];
                }
                template = {
                    id: result.id,
                    name: result.name,
                    title: result.title,
                    xAxis: result.xAxis,
                    yAxes: JSON.parse(result.yAxes || '[]'),
                    chartType: result.chartType,
                    strokeWidth: result.strokeWidth,
                    showGrid: result.showGrid === 1,
                    showMinorGrid: result.showMinorGrid === 1,
                    xMin: result.xMin,
                    xMax: result.xMax,
                    yMin: result.yMin,
                    yMax: result.yMax,
                    xAxisLabel: result.xAxisLabel,
                    yAxisLabel: result.yAxisLabel,
                    xAxisType: result.xAxisType,
                    sourceLogId: result.sourceLogId,
                    savedAt: result.savedAt
                };
                return [2 /*return*/, new Response(JSON.stringify(template), {
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        status: 200
                    })];
            case 2:
                error_3 = _a.sent();
                console.error('Failed to get template:', error_3);
                return [2 /*return*/, new Response(JSON.stringify({ error: 'Failed to get template' }), { headers: corsHeaders, status: 500 })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/templates - Create new template
router.post('/api/templates', function (request, env) { return __awaiter(void 0, void 0, void 0, function () {
    var template, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, request.json()];
            case 1:
                template = _a.sent();
                if (!template.id || !template.name || !template.title) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing required fields' }), { headers: corsHeaders, status: 400 })];
                }
                return [4 /*yield*/, env.DB.prepare("INSERT INTO templates (\n        id, name, title, xAxis, yAxes, chartType, strokeWidth,\n        showGrid, showMinorGrid, xMin, xMax, yMin, yMax,\n        xAxisLabel, yAxisLabel, xAxisType, sourceLogId, savedAt\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(template.id, template.name, template.title, template.xAxis, JSON.stringify(template.yAxes), template.chartType, template.strokeWidth || 2, template.showGrid ? 1 : 0, template.showMinorGrid ? 1 : 0, template.xMin, template.xMax, template.yMin, template.yMax, template.xAxisLabel, template.yAxisLabel, template.xAxisType || 'number', template.sourceLogId, template.savedAt || new Date().toISOString()).run()];
            case 2:
                _a.sent();
                return [2 /*return*/, new Response(JSON.stringify(template), {
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        status: 201
                    })];
            case 3:
                error_4 = _a.sent();
                console.error('Failed to create template:', error_4);
                return [2 /*return*/, new Response(JSON.stringify({ error: 'Failed to create template' }), { headers: corsHeaders, status: 500 })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// PUT /api/templates/:id - Update template
router.put('/api/templates/:id', function (request, env) { return __awaiter(void 0, void 0, void 0, function () {
    var id, template, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = request.params.id;
                return [4 /*yield*/, request.json()];
            case 1:
                template = _a.sent();
                if (template.id !== id) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Template ID mismatch' }), { headers: corsHeaders, status: 400 })];
                }
                return [4 /*yield*/, env.DB.prepare("UPDATE templates SET\n        name = ?, title = ?, xAxis = ?, yAxes = ?, chartType = ?,\n        strokeWidth = ?, showGrid = ?, showMinorGrid = ?,\n        xMin = ?, xMax = ?, yMin = ?, yMax = ?,\n        xAxisLabel = ?, yAxisLabel = ?, xAxisType = ?, sourceLogId = ?,\n        savedAt = ?, updatedAt = CURRENT_TIMESTAMP\n      WHERE id = ?").bind(template.name, template.title, template.xAxis, JSON.stringify(template.yAxes), template.chartType, template.strokeWidth || 2, template.showGrid ? 1 : 0, template.showMinorGrid ? 1 : 0, template.xMin, template.xMax, template.yMin, template.yMax, template.xAxisLabel, template.yAxisLabel, template.xAxisType || 'number', template.sourceLogId, template.savedAt || new Date().toISOString(), id).run()];
            case 2:
                _a.sent();
                return [2 /*return*/, new Response(JSON.stringify(template), {
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        status: 200
                    })];
            case 3:
                error_5 = _a.sent();
                console.error('Failed to update template:', error_5);
                return [2 /*return*/, new Response(JSON.stringify({ error: 'Failed to update template' }), { headers: corsHeaders, status: 500 })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// DELETE /api/templates/:id - Delete template
router.delete('/api/templates/:id', function (request, env) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = request.params.id;
                return [4 /*yield*/, env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id).run()];
            case 1:
                _a.sent();
                return [2 /*return*/, new Response(JSON.stringify({ success: true }), {
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        status: 200
                    })];
            case 2:
                error_6 = _a.sent();
                console.error('Failed to delete template:', error_6);
                return [2 /*return*/, new Response(JSON.stringify({ error: 'Failed to delete template' }), { headers: corsHeaders, status: 500 })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// OPTIONS handler for CORS
router.options('*', function () {
    return new Response(null, {
        headers: corsHeaders,
        status: 200
    });
});
// 404 handler
router.all('*', function () {
    return new Response(JSON.stringify({ error: 'Not found' }), {
        headers: corsHeaders,
        status: 404
    });
});
// Export handler
exports.default = {
    fetch: router.handle
};
