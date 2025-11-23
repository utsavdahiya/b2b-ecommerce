'use client';

import React from 'react';
import DieShapeSelector from './DieShapeSelector';
import type { CategoryFilter, SelectFilter, DieShapeFilter, TextFilter, NumberFilter } from '@/lib/types/categoryConfig';
import { isSelectFilter, isDieShapeFilter, isTextFilter, isNumberFilter } from '@/lib/types/categoryConfig';

export interface CategoryFilterProps {
  /** The filter key/identifier */
  filterKey: string;
  /** The filter configuration */
  filter: CategoryFilter;
  /** Current selected value */
  value?: string | number;
  /** Callback when filter value changes */
  onChange: (key: string, value: string | number) => void;
  /** Optional custom className for the container */
  className?: string;
  /** Optional variant for styling */
  variant?: 'default' | 'compact';
}

/**
 * Reusable Category Filter Component
 * 
 * Renders different filter types based on the filter configuration:
 * - select: Button groups (optimized layout based on option count)
 * - die_shape_selector: Visual die shape picker with modal
 * - text: Text input field
 * - number: Number input field
 */
export default function CategoryFilter({
  filterKey,
  filter,
  value,
  onChange,
  className = '',
  variant = 'default',
}: CategoryFilterProps) {
  const handleChange = (newValue: string | number) => {
    onChange(filterKey, newValue);
  };

  // Render select filter with optimized layouts
  const renderSelectFilter = () => {
    if (!isSelectFilter(filter)) return null;
    
    const selectFilter = filter as SelectFilter;
    const optionCount = selectFilter.options.length;
    const paddingClass = variant === 'compact' ? 'p-4' : 'p-5';
    const titleSize = variant === 'compact' ? 'text-base' : 'text-lg';

    if (optionCount <= 2) {
      // For 2 options: side-by-side toggle buttons
      return (
        <div className={`bg-white rounded-lg shadow-md ${paddingClass} ${className}`}>
          <label className={`block ${titleSize} font-semibold text-gray-900 mb-3`}>
            {filter.label}
            {filter.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {selectFilter.options.map((option) => (
              <button
                key={option}
                onClick={() => handleChange(option)}
                className={`
                  px-4 py-2.5 rounded-lg border-2 transition-all font-medium text-sm
                  active:scale-95
                  ${value === option
                    ? 'border-primary-600 bg-primary-600 text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    } else if (optionCount <= 4) {
      // For 3-4 options: Compact horizontal button group (best for UV, Foil, Printing)
      // Shows all options at once for faster selection - better UX than dropdowns
      return (
        <div className={`bg-white rounded-lg shadow-md ${paddingClass} ${className}`}>
          <label className={`block ${titleSize} font-semibold text-gray-900 mb-3`}>
            {selectFilter.label}
            {selectFilter.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {selectFilter.options.map((option) => (
              <button
                key={option}
                onClick={() => handleChange(option)}
                className={`
                  flex-1 min-w-[70px] sm:min-w-[90px] max-w-[140px] sm:max-w-none
                  px-3 sm:px-4 py-2.5 rounded-lg border-2 transition-all font-medium text-sm
                  active:scale-95
                  ${value === option
                    ? 'border-primary-600 bg-primary-600 text-white shadow-md ring-2 ring-primary-200'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50 hover:shadow-sm'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    } else {
      // For 5+ options: Responsive grid
      return (
        <div className={`bg-white rounded-lg shadow-md ${paddingClass} ${className}`}>
          <label className={`block ${titleSize} font-semibold text-gray-900 mb-3`}>
            {selectFilter.label}
            {selectFilter.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selectFilter.options.map((option) => (
              <button
                key={option}
                onClick={() => handleChange(option)}
                className={`
                  px-3 py-2.5 rounded-lg border-2 transition-all font-medium text-sm
                  active:scale-95
                  ${value === option
                    ? 'border-primary-600 bg-primary-600 text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }
  };

  // Render die shape selector
  const renderDieShapeFilter = () => {
    if (!isDieShapeFilter(filter)) return null;
    
    const dieShapeFilter = filter as DieShapeFilter;
    const paddingClass = variant === 'compact' ? 'p-4' : 'p-6';
    const titleSize = variant === 'compact' ? 'text-lg' : 'text-xl';

    return (
      <div className={`bg-white rounded-lg shadow-md ${paddingClass} ${className}`}>
        <h2 className={`${titleSize} font-semibold text-gray-900 mb-4`}>
          {dieShapeFilter.label}
          {dieShapeFilter.required && <span className="text-red-500 ml-1">*</span>}
        </h2>
        <DieShapeSelector
          options={dieShapeFilter.options}
          selected={(value as string) || dieShapeFilter.default}
          onChange={(shapeId) => handleChange(shapeId)}
        />
      </div>
    );
  };

  // Render text input
  const renderTextFilter = () => {
    if (!isTextFilter(filter)) return null;
    
    const textFilter = filter as TextFilter;
    const paddingClass = variant === 'compact' ? 'p-4' : 'p-6';

    return (
      <div className={`bg-white rounded-lg shadow-md ${paddingClass} ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {textFilter.label}
          {textFilter.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          required={textFilter.required}
          placeholder={textFilter.default ? String(textFilter.default) : undefined}
        />
      </div>
    );
  };

  // Render number input
  const renderNumberFilter = () => {
    if (!isNumberFilter(filter)) return null;
    
    const numberFilter = filter as NumberFilter;
    const paddingClass = variant === 'compact' ? 'p-4' : 'p-6';

    return (
      <div className={`bg-white rounded-lg shadow-md ${paddingClass} ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {numberFilter.label}
          {numberFilter.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="number"
          value={value !== undefined ? value : ''}
          onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          required={numberFilter.required}
          placeholder={numberFilter.default ? String(numberFilter.default) : undefined}
        />
      </div>
    );
  };

  // Render based on filter type
  switch (filter.type) {
    case 'select':
      return renderSelectFilter();
    case 'die_shape_selector':
      return renderDieShapeFilter();
    case 'text':
      return renderTextFilter();
    case 'number':
      return renderNumberFilter();
    default:
      return null;
  }
}

