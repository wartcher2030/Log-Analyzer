/**
 * Cloudflare Workers API for IdeaLogs
 * Handles template persistence with D1 database
 */

import { Router } from 'itty-router';
import { PlotTemplate } from '../types';

const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CloudflareEnv {
  DB: D1Database;
  ENVIRONMENT: string;
}

// Initialize database schema
const initDatabase = async (db: D1Database) => {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        xAxis TEXT NOT NULL,
        yAxes TEXT NOT NULL,
        chartType TEXT DEFAULT 'line',
        strokeWidth INTEGER DEFAULT 2,
        showGrid INTEGER DEFAULT 1,
        showMinorGrid INTEGER DEFAULT 0,
        xMin TEXT,
        xMax TEXT,
        yMin REAL,
        yMax REAL,
        xAxisLabel TEXT,
        yAxisLabel TEXT,
        xAxisType TEXT DEFAULT 'number',
        sourceLogId TEXT,
        savedAt TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_templates_createdAt ON templates(createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_templates_sourceLogId ON templates(sourceLogId);
    `);
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

// GET /api/templates - List all templates
router.get('/api/templates', async (request, env: CloudflareEnv) => {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM templates ORDER BY createdAt DESC LIMIT 100'
    ).all();

    const templates: PlotTemplate[] = (results || []).map((row: any) => ({
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
    }));

    return new Response(JSON.stringify(templates), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Failed to list templates:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list templates' }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// GET /api/templates/:id - Get single template
router.get('/api/templates/:id', async (request, env: CloudflareEnv) => {
  try {
    const { id } = request.params as { id: string };
    
    const result = await env.DB.prepare(
      'SELECT * FROM templates WHERE id = ?'
    ).bind(id).first();

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { headers: corsHeaders, status: 404 }
      );
    }

    const template: PlotTemplate = {
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

    return new Response(JSON.stringify(template), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Failed to get template:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get template' }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// POST /api/templates - Create new template
router.post('/api/templates', async (request, env: CloudflareEnv) => {
  try {
    const template: PlotTemplate = await request.json();

    if (!template.id || !template.name || !template.title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    await env.DB.prepare(
      `INSERT INTO templates (
        id, name, title, xAxis, yAxes, chartType, strokeWidth,
        showGrid, showMinorGrid, xMin, xMax, yMin, yMax,
        xAxisLabel, yAxisLabel, xAxisType, sourceLogId, savedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      template.id, template.name, template.title, template.xAxis,
      JSON.stringify(template.yAxes), template.chartType, template.strokeWidth || 2,
      template.showGrid ? 1 : 0, template.showMinorGrid ? 1 : 0,
      template.xMin, template.xMax, template.yMin, template.yMax,
      template.xAxisLabel, template.yAxisLabel, template.xAxisType || 'number',
      template.sourceLogId, template.savedAt || new Date().toISOString()
    ).run();

    return new Response(JSON.stringify(template), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201
    });
  } catch (error) {
    console.error('Failed to create template:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create template' }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// PUT /api/templates/:id - Update template
router.put('/api/templates/:id', async (request, env: CloudflareEnv) => {
  try {
    const { id } = request.params as { id: string };
    const template: PlotTemplate = await request.json();

    if (template.id !== id) {
      return new Response(
        JSON.stringify({ error: 'Template ID mismatch' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    await env.DB.prepare(
      `UPDATE templates SET
        name = ?, title = ?, xAxis = ?, yAxes = ?, chartType = ?,
        strokeWidth = ?, showGrid = ?, showMinorGrid = ?,
        xMin = ?, xMax = ?, yMin = ?, yMax = ?,
        xAxisLabel = ?, yAxisLabel = ?, xAxisType = ?, sourceLogId = ?,
        savedAt = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).bind(
      template.name, template.title, template.xAxis,
      JSON.stringify(template.yAxes), template.chartType, template.strokeWidth || 2,
      template.showGrid ? 1 : 0, template.showMinorGrid ? 1 : 0,
      template.xMin, template.xMax, template.yMin, template.yMax,
      template.xAxisLabel, template.yAxisLabel, template.xAxisType || 'number',
      template.sourceLogId, template.savedAt || new Date().toISOString(),
      id
    ).run();

    return new Response(JSON.stringify(template), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Failed to update template:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update template' }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/api/templates/:id', async (request, env: CloudflareEnv) => {
  try {
    const { id } = request.params as { id: string };

    await env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete template' }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// OPTIONS handler for CORS
router.options('*', () => {
  return new Response(null, {
    headers: corsHeaders,
    status: 200
  });
});

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    headers: corsHeaders,
    status: 404
  });
});

// Export handler
export default {
  fetch: router.handle
};
