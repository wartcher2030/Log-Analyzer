-- Ideologs Templates Database Schema
-- D1 Migration v1

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_createdAt ON templates(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_templates_sourceLogId ON templates(sourceLogId);
CREATE INDEX IF NOT EXISTS idx_templates_updated ON templates(updatedAt DESC);

-- Insert default templates
INSERT OR IGNORE INTO templates (id, name, title, xAxis, yAxes, chartType, strokeWidth, showGrid, xAxisLabel, yAxisLabel, savedAt) VALUES
('st_1', 'Altitude Stability', 'Altitude vs Flight Time', 'Flight Time_raw', '["Altitude","Desired Altitude"]', 'line', 2, 1, 'Time (s)', 'Altitude (m)', datetime('now')),
('st_2', 'Attitude Stability', 'Attitude Analysis', 'Flight Time_raw', '["Phi","The","Psi"]', 'line', 2, 1, 'Time (s)', 'Deg', datetime('now'));
