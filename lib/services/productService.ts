/**
 * Product Service
 * 
 * PORTABLE business logic for product management and pricing calculations
 * No dependencies on Next.js - can be moved to separate backend
 */

import { query } from '../db/index';

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  sub_category?: string;
  product_code?: string;
  base_price_model: any;
  image_urls?: string[];
  stock_quantity?: number;
  estimated_delivery_days?: number;
  attributes?: Record<string, string>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductConfiguration {
  quantity: number;
  material?: string;
  size?: string;
  paper?: string;
  finishing?: string[];
  fold?: string;
  [key: string]: any;
}

export interface PriceCalculation {
  basePrice: number;
  quantityPrice: number;
  optionsPrice: number;
  totalPrice: number;
  pricePerUnit: number;
  breakdown: {
    quantity: number;
    material?: number;
    size?: number;
    paper?: number;
    finishing?: Record<string, number>;
    fold?: number;
  };
}

/**
 * Get all active products
 */
export async function getAllProducts(includeInactive = false): Promise<Product[]> {
  try {
    const sql = includeInactive
      ? 'SELECT * FROM products ORDER BY category, name'
      : 'SELECT * FROM products WHERE is_active = true ORDER BY category, name';
    
    const result = await query(sql);
    return result.rows;
  } catch (error) {
    console.error('Get products error:', error);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(productId: number): Promise<Product | null> {
  try {
    const result = await query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Get product error:', error);
    return null;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const result = await query(
      'SELECT * FROM products WHERE category = $1 AND is_active = true ORDER BY name',
      [category]
    );
    return result.rows;
  } catch (error) {
    console.error('Get products by category error:', error);
    return [];
  }
}

/**
 * Calculate price for a product configuration
 * This is the CORE pricing logic - used both client and server side
 */
export function calculatePrice(
  product: Product,
  config: ProductConfiguration
): PriceCalculation {
  const priceModel = product.base_price_model;
  const breakdown: any = {};

  // 1. Calculate base price
  const basePrice = priceModel.base_price || 0;
  breakdown.quantity = config.quantity;

  // 2. Calculate quantity-based pricing
  let pricePerUnit = 0;
  const priceTiers = priceModel.price_tiers || [];
  
  for (const tier of priceTiers) {
    if (
      config.quantity >= tier.min_quantity &&
      (tier.max_quantity === null || config.quantity <= tier.max_quantity)
    ) {
      pricePerUnit = tier.price_per_unit;
      break;
    }
  }

  const quantityPrice = pricePerUnit * config.quantity;

  // 3. Calculate options pricing
  let optionsPrice = 0;

  // Material options
  if (config.material && priceModel.material_options) {
    const materialCost = priceModel.material_options[config.material] || 0;
    optionsPrice += materialCost * config.quantity;
    breakdown.material = materialCost;
  }

  // Size options
  if (config.size && priceModel.size_options) {
    const sizeCost = priceModel.size_options[config.size] || 0;
    optionsPrice += sizeCost * config.quantity;
    breakdown.size = sizeCost;
  }

  // Paper options
  if (config.paper && priceModel.paper_options) {
    const paperCost = priceModel.paper_options[config.paper] || 0;
    optionsPrice += paperCost * config.quantity;
    breakdown.paper = paperCost;
  }

  // Fold options
  if (config.fold && priceModel.fold_options) {
    const foldCost = priceModel.fold_options[config.fold] || 0;
    optionsPrice += foldCost * config.quantity;
    breakdown.fold = foldCost;
  }

  // Printing options
  if (config.printing && priceModel.printing_options) {
    const printingCost = priceModel.printing_options[config.printing] || 0;
    optionsPrice += printingCost * config.quantity;
    breakdown.printing = printingCost;
  }

  // Finishing options (can be multiple)
  if (config.finishing && Array.isArray(config.finishing) && priceModel.finishing_options) {
    breakdown.finishing = {};
    for (const finish of config.finishing) {
      const finishCost = priceModel.finishing_options[finish] || 0;
      optionsPrice += finishCost * config.quantity;
      breakdown.finishing[finish] = finishCost;
    }
  }

  // 4. Calculate total
  const totalPrice = basePrice + quantityPrice + optionsPrice;

  return {
    basePrice,
    quantityPrice,
    optionsPrice,
    totalPrice: Math.max(0, totalPrice), // Ensure non-negative
    pricePerUnit,
    breakdown,
  };
}

/**
 * Validate product configuration
 * Ensures all required fields are present and valid
 */
export function validateConfiguration(
  product: Product,
  config: ProductConfiguration
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const priceModel = product.base_price_model;

  // Check quantity
  if (!config.quantity || config.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  // Check if quantity meets minimum for any tier
  const priceTiers = priceModel.price_tiers || [];
  if (priceTiers.length > 0) {
    const minQuantity = Math.min(...priceTiers.map((t: any) => t.min_quantity));
    if (config.quantity < minQuantity) {
      errors.push(`Minimum quantity is ${minQuantity}`);
    }
  }

  // Validate material option
  if (priceModel.material_options && config.material) {
    if (!priceModel.material_options.hasOwnProperty(config.material)) {
      errors.push('Invalid material option');
    }
  }

  // Validate size option
  if (priceModel.size_options && config.size) {
    if (!priceModel.size_options.hasOwnProperty(config.size)) {
      errors.push('Invalid size option');
    }
  }

  // Validate paper option
  if (priceModel.paper_options && config.paper) {
    if (!priceModel.paper_options.hasOwnProperty(config.paper)) {
      errors.push('Invalid paper option');
    }
  }

  // Validate finishing options
  if (priceModel.finishing_options && config.finishing && Array.isArray(config.finishing)) {
    for (const finish of config.finishing) {
      if (!priceModel.finishing_options.hasOwnProperty(finish)) {
        errors.push(`Invalid finishing option: ${finish}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available configuration options for a product
 * Useful for building dynamic forms
 */
export function getConfigurationOptions(product: Product) {
  const priceModel = product.base_price_model;

  return {
    priceTiers: priceModel.price_tiers || [],
    materials: Object.keys(priceModel.material_options || {}),
    sizes: Object.keys(priceModel.size_options || {}),
    papers: Object.keys(priceModel.paper_options || {}),
    finishingOptions: Object.keys(priceModel.finishing_options || {}),
    foldOptions: Object.keys(priceModel.fold_options || {}),
    printingOptions: Object.keys(priceModel.printing_options || {}),
  };
}

/**
 * Format option name for display
 * Converts snake_case to Title Case
 */
export function formatOptionName(optionKey: string): string {
  return optionKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get product categories
 */
export async function getCategories(): Promise<string[]> {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category'
    );
    return result.rows.map(row => row.category);
  } catch (error) {
    console.error('Get categories error:', error);
    return [];
  }
}

