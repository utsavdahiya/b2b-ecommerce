'use client';

import React from 'react';
import CategoryFilter from './CategoryFilter';
import type { CategoryFilters } from '@/lib/types/categoryConfig';

export interface CategoryFiltersProps {
  /** Category filters configuration */
  filters: CategoryFilters;
  /** Current form values */
  values: Record<string, string | number | undefined>;
  /** Callback when any filter value changes */
  onChange: (key: string, value: string | number) => void;
  /** Optional custom className for the container */
  className?: string;
  /** Optional variant for styling */
  variant?: 'default' | 'compact';
  /** Optional: Filter keys to exclude */
  excludeKeys?: string[];
  /** Optional: Only render specific filter keys */
  includeKeys?: string[];
}

/**
 * Category Filters Component
 * 
 * Renders multiple category filters based on the filters configuration.
 * Automatically handles different filter types and layouts.
 */
export default function CategoryFilters({
  filters,
  values,
  onChange,
  className = '',
  variant = 'default',
  excludeKeys = [],
  includeKeys,
}: CategoryFiltersProps) {
  // Filter the filters based on include/exclude keys
  const filteredFilters = Object.entries(filters).filter(([key]) => {
    if (excludeKeys.includes(key)) return false;
    if (includeKeys && !includeKeys.includes(key)) return false;
    return true;
  });

  if (filteredFilters.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {filteredFilters.map(([key, filter]) => (
        <CategoryFilter
          key={key}
          filterKey={key}
          filter={filter}
          value={values[key]}
          onChange={onChange}
          variant={variant}
        />
      ))}
    </div>
  );
}

