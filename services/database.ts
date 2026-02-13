import { PlotTemplate } from '../types';

/**
 * Database service for template persistence
 * - In production: Uses Cloudflare Workers + D1 database API
 * - In development: Falls back to localStorage
 */

const API_BASE: string = (import.meta.env.VITE_API_BASE as string) || '/api';
const IS_PRODUCTION = import.meta.env.MODE === 'production';

export interface DatabaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Save template to database
 */
export const saveTemplate = async (template: PlotTemplate): Promise<DatabaseResponse<PlotTemplate>> => {
  try {
    const response = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...template,
        savedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Server error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to save template:', error);
    return { 
      success: false, 
      error: 'Failed to connect to database. Templates will be saved locally only.' 
    };
  }
};

/**
 * Load all templates from database
 */
export const loadTemplates = async (): Promise<DatabaseResponse<PlotTemplate[]>> => {
  try {
    const response = await fetch(`${API_BASE}/templates`);

    if (!response.ok) {
      return { success: false, error: `Server error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to load templates:', error);
    return { 
      success: false, 
      error: 'Failed to connect to database. Using local templates only.' 
    };
  }
};

/**
 * Load single template
 */
export const loadTemplate = async (id: string): Promise<DatabaseResponse<PlotTemplate>> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${id}`);

    if (!response.ok) {
      return { success: false, error: `Template not found: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to load template:', error);
    return { success: false, error: 'Failed to load template' };
  }
};

/**
 * Delete template from database
 */
export const deleteTemplate = async (id: string): Promise<DatabaseResponse<boolean>> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      return { success: false, error: `Server error: ${response.status}` };
    }

    return { success: true, data: true };
  } catch (error) {
    console.error('Failed to delete template:', error);
    return { success: false, error: 'Failed to delete template' };
  }
};

/**
 * Update template in database
 */
export const updateTemplate = async (template: PlotTemplate): Promise<DatabaseResponse<PlotTemplate>> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${template.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...template,
        savedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      return { success: false, error: `Server error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to update template:', error);
    return { success: false, error: 'Failed to update template' };
  }
};

/**
 * Local storage fallback for offline mode
 */
export const useLocalStorage = {
  saveTemplate: (template: PlotTemplate) => {
    try {
      const existing = localStorage.getItem('idealogs_templates');
      const templates = existing ? JSON.parse(existing) : [];
      const index = templates.findIndex((t: PlotTemplate) => t.id === template.id);
      
      if (index >= 0) {
        templates[index] = template;
      } else {
        templates.push(template);
      }
      
      localStorage.setItem('idealogs_templates', JSON.stringify(templates));
      return true;
    } catch (e) {
      console.error('LocalStorage save failed:', e);
      return false;
    }
  },

  loadTemplates: (): PlotTemplate[] => {
    try {
      const data = localStorage.getItem('idealogs_templates');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('LocalStorage load failed:', e);
      return [];
    }
  },

  deleteTemplate: (id: string) => {
    try {
      const existing = localStorage.getItem('idealogs_templates');
      const templates = existing ? JSON.parse(existing) : [];
      const filtered = templates.filter((t: PlotTemplate) => t.id !== id);
      localStorage.setItem('idealogs_templates', JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('LocalStorage delete failed:', e);
      return false;
    }
  }
};
