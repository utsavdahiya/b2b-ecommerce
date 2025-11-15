/**
 * Config Service
 * 
 * Service for managing application configuration stored in the database
 */

import { query } from '../db/index';

export interface Config {
  id: number;
  key: string;
  value: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get config value by key
 */
export async function getConfig(key: string): Promise<string | null> {
  try {
    const result = await query(
      'SELECT value FROM config WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].value;
  } catch (error) {
    console.error('Get config error:', error);
    return null;
  }
}

/**
 * Set config value by key
 */
export async function setConfig(key: string, value: string, description?: string): Promise<boolean> {
  try {
    await query(
      `INSERT INTO config (key, value, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) 
       DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description`,
      [key, value, description || null]
    );
    
    return true;
  } catch (error) {
    console.error('Set config error:', error);
    return false;
  }
}

/**
 * Get all config entries
 */
export async function getAllConfig(): Promise<Config[]> {
  try {
    const result = await query(
      'SELECT * FROM config ORDER BY key'
    );
    
    return result.rows;
  } catch (error) {
    console.error('Get all config error:', error);
    return [];
  }
}

