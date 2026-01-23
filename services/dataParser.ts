
import { LogData, Stats } from '../types';

export const parseCSV = async (file: File): Promise<LogData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return reject("Empty file");

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 1) return reject("Insufficient data");

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, any> = {};
        headers.forEach((header, i) => {
          const val = values[i]?.trim() || "";
          const num = parseFloat(val);
          
          // Store both types: 
          // 1. Header name stores numeric value for Y-axis plotting
          // 2. Header_raw stores original string for categorical X-axis labels
          row[header] = isNaN(num) ? val : num;
          row[`${header}_raw`] = val; 
        });
        return row;
      });

      resolve({
        id: Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        headers,
        originalRows: rows,
        computedRows: rows
      });
    };
    reader.onerror = () => reject("Error reading file");
    reader.readAsText(file);
  });
};

export const calculateStats = (data: Record<string, any>[], column: string): Stats | null => {
  const values = data
    .map(row => row[column])
    .filter(val => typeof val === 'number' && !isNaN(val));

  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;
  
  return { min, max, mean };
};
