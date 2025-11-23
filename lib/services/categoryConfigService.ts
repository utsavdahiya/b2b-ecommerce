import { query } from '../db';

export interface CategoryFilter {
  label: string;
  type: 'select' | 'die_shape_selector' | 'text' | 'number';
  options?: Array<string | { id: string; name: string; shape: string }>;
  required?: boolean;
  default?: string | number;
}

export interface CategoryFilters {
  [key: string]: CategoryFilter;
}

export interface CategoryConfig {
  id: number;
  category: string;
  filters: CategoryFilters;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export const categoryConfigService = {
  /**
   * Get filter configuration for a specific category
   */
  async getByCategory(category: string): Promise<CategoryConfig | null> {
    try {
      const result = await query(
        'SELECT * FROM category_config WHERE category = $1',
        [category]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching category config:', error);
      throw new Error('Failed to fetch category configuration');
    }
  },

  /**
   * Get all category configurations
   */
  async getAll(): Promise<CategoryConfig[]> {
    try {
      const result = await query(
        'SELECT * FROM category_config ORDER BY category ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching all category configs:', error);
      throw new Error('Failed to fetch category configurations');
    }
  },

  /**
   * Create a new category configuration
   */
  async create(
    category: string,
    filters: CategoryFilters,
    description?: string
  ): Promise<CategoryConfig> {
    try {
      const result = await query(
        `INSERT INTO category_config (category, filters, description) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [category, JSON.stringify(filters), description || null]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating category config:', error);
      throw new Error('Failed to create category configuration');
    }
  },

  /**
   * Update an existing category configuration
   */
  async update(
    category: string,
    filters: CategoryFilters,
    description?: string
  ): Promise<CategoryConfig | null> {
    try {
      const result = await query(
        `UPDATE category_config 
         SET filters = $2, description = $3, updated_at = CURRENT_TIMESTAMP 
         WHERE category = $1 
         RETURNING *`,
        [category, JSON.stringify(filters), description || null]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating category config:', error);
      throw new Error('Failed to update category configuration');
    }
  },

  /**
   * Upsert (create or update) a category configuration
   */
  async upsert(
    category: string,
    filters: CategoryFilters,
    description?: string
  ): Promise<CategoryConfig> {
    try {
      const result = await query(
        `INSERT INTO category_config (category, filters, description) 
         VALUES ($1, $2, $3)
         ON CONFLICT (category) 
         DO UPDATE SET 
           filters = EXCLUDED.filters,
           description = EXCLUDED.description,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [category, JSON.stringify(filters), description || null]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error upserting category config:', error);
      throw new Error('Failed to upsert category configuration');
    }
  },

  /**
   * Delete a category configuration
   */
  async delete(category: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM category_config WHERE category = $1',
        [category]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting category config:', error);
      throw new Error('Failed to delete category configuration');
    }
  },

  /**
   * Check if a category has filter configuration
   */
  async hasConfig(category: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM category_config WHERE category = $1',
        [category]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error checking category config:', error);
      return false;
    }
  },
};

