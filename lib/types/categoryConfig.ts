/**
 * Type definitions for Category Configuration System
 */

// Base filter interface
export interface BaseFilter {
  label: string;
  required?: boolean;
  default?: string | number;
}

// Select filter (dropdown)
export interface SelectFilter extends BaseFilter {
  type: 'select';
  options: string[];
}

// Die shape filter (modal picker)
export interface DieShapeOption {
  id: string;
  name: string;
  shape: string;
}

export interface DieShapeFilter extends BaseFilter {
  type: 'die_shape_selector';
  options: DieShapeOption[];
  default?: string; // die shape id
}

// Text filter
export interface TextFilter extends BaseFilter {
  type: 'text';
}

// Number filter
export interface NumberFilter extends BaseFilter {
  type: 'number';
}

// Union type of all filter types
export type CategoryFilter = SelectFilter | DieShapeFilter | TextFilter | NumberFilter;

// Category filters object
export interface CategoryFilters {
  [filterKey: string]: CategoryFilter;
}

// Category configuration
export interface CategoryConfig {
  id: number;
  category: string;
  filters: CategoryFilters;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// API response types
export interface CategoryConfigResponse {
  data: CategoryConfig;
}

export interface CategoryConfigListResponse {
  data: CategoryConfig[];
}

export interface CategoryConfigError {
  error: string;
}

// Form data type for product configuration
export interface ProductConfigFormData {
  [filterKey: string]: string | number | undefined;
}

// Helper type guards
export function isSelectFilter(filter: CategoryFilter): filter is SelectFilter {
  return filter.type === 'select';
}

export function isDieShapeFilter(filter: CategoryFilter): filter is DieShapeFilter {
  return filter.type === 'die_shape_selector';
}

export function isTextFilter(filter: CategoryFilter): filter is TextFilter {
  return filter.type === 'text';
}

export function isNumberFilter(filter: CategoryFilter): filter is NumberFilter {
  return filter.type === 'number';
}

// Validation helper
export function validateFormData(
  filters: CategoryFilters,
  formData: ProductConfigFormData
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.entries(filters).forEach(([key, filter]) => {
    if (filter.required && !formData[key]) {
      errors.push(`${filter.label} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper to get default form values
export function getDefaultFormData(filters: CategoryFilters): ProductConfigFormData {
  const defaults: ProductConfigFormData = {};

  Object.entries(filters).forEach(([key, filter]) => {
    if (filter.default !== undefined) {
      defaults[key] = filter.default;
    }
  });

  return defaults;
}

// Helper to format filter options for display
export function formatFilterOption(option: string | DieShapeOption): string {
  if (typeof option === 'string') {
    return option;
  }
  return option.name;
}

// Helper to check if all required filters are filled
export function areRequiredFiltersFilled(
  filters: CategoryFilters,
  formData: ProductConfigFormData
): boolean {
  return Object.entries(filters).every(([key, filter]) => {
    if (!filter.required) return true;
    return formData[key] !== undefined && formData[key] !== '';
  });
}

// Export all die shape types for reference
export const DIE_SHAPE_TYPES = [
  'rectangle',
  'rounded-rectangle',
  'rounded-corners',
  'rounded-top',
  'angled-corner',
  'tab-right',
  'tab-left',
  'oval',
  'ellipse',
  'rounded-badge',
  'house',
  'ticket',
  'label',
  'cloud',
  'rounded-label',
  'diamond',
  'arrow',
  'rounded-pill',
  'simple-tab',
  'angled-tab',
  'wave',
  'hexagon',
  'organic',
  'curved',
  'tag',
  'banner',
  'rounded-banner',
  'shield',
  'bookmark',
  'curved-tab',
  'tab-corner',
  'scalloped',
  'angled-scalloped',
  'octagon',
  'pentagon',
  'rounded-pentagon',
] as const;

export type DieShapeType = typeof DIE_SHAPE_TYPES[number];

