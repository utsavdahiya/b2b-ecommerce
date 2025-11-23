'use client';

import React, { useState } from 'react';

export interface DieShape {
  id: string;
  name: string;
  shape: string;
}

interface DieShapeSelectorProps {
  options: DieShape[];
  selected?: string;
  onChange: (shapeId: string) => void;
  disabled?: boolean;
}

export default function DieShapeSelector({
  options,
  selected = 'die-1',
  onChange,
  disabled = false,
}: DieShapeSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedShape = options.find((opt) => opt.id === selected);

  const handleSelect = (shapeId: string) => {
    onChange(shapeId);
    setIsModalOpen(false);
  };

  // SVG path generators for different shapes
  const getShapePath = (shape: string): JSX.Element => {
    const baseProps = {
      className: "fill-current w-full h-full",
      viewBox: "0 0 100 60",
    };

    switch (shape) {
      case 'rectangle':
        return (
          <svg {...baseProps}>
            <rect x="5" y="5" width="90" height="50" rx="0" />
          </svg>
        );
      case 'rounded-rectangle':
        return (
          <svg {...baseProps}>
            <rect x="5" y="5" width="90" height="50" rx="5" />
          </svg>
        );
      case 'rounded-corners':
        return (
          <svg {...baseProps}>
            <rect x="5" y="5" width="90" height="50" rx="8" />
          </svg>
        );
      case 'rounded-top':
        return (
          <svg {...baseProps}>
            <path d="M 5 55 L 5 10 Q 5 5 10 5 L 90 5 Q 95 5 95 10 L 95 55 Z" />
          </svg>
        );
      case 'angled-corner':
        return (
          <svg {...baseProps}>
            <path d="M 5 55 L 5 5 L 95 5 L 95 40 L 80 55 Z" />
          </svg>
        );
      case 'tab-right':
        return (
          <svg {...baseProps}>
            <path d="M 5 5 L 85 5 L 85 20 L 95 20 L 95 40 L 85 40 L 85 55 L 5 55 Z" />
          </svg>
        );
      case 'tab-left':
        return (
          <svg {...baseProps}>
            <path d="M 95 5 L 15 5 L 15 20 L 5 20 L 5 40 L 15 40 L 15 55 L 95 55 Z" />
          </svg>
        );
      case 'oval':
        return (
          <svg {...baseProps}>
            <ellipse cx="50" cy="30" rx="45" ry="25" />
          </svg>
        );
      case 'ellipse':
        return (
          <svg {...baseProps}>
            <ellipse cx="50" cy="30" rx="40" ry="22" />
          </svg>
        );
      case 'rounded-badge':
        return (
          <svg {...baseProps}>
            <path d="M 50 5 Q 70 5 85 15 Q 95 25 95 30 Q 95 35 85 45 Q 70 55 50 55 Q 30 55 15 45 Q 5 35 5 30 Q 5 25 15 15 Q 30 5 50 5" />
          </svg>
        );
      case 'house':
        return (
          <svg {...baseProps}>
            <path d="M 5 30 L 50 5 L 95 30 L 95 55 L 5 55 Z" />
          </svg>
        );
      case 'ticket':
        return (
          <svg {...baseProps}>
            <path d="M 10 5 L 90 5 L 90 25 Q 85 25 85 30 Q 85 35 90 35 L 90 55 L 10 55 L 10 35 Q 15 35 15 30 Q 15 25 10 25 Z" />
          </svg>
        );
      case 'label':
        return (
          <svg {...baseProps}>
            <path d="M 5 5 L 85 5 L 95 30 L 85 55 L 5 55 Z" />
          </svg>
        );
      case 'cloud':
        return (
          <svg {...baseProps}>
            <path d="M 25 25 Q 25 15 35 15 Q 40 10 50 10 Q 60 10 65 15 Q 75 15 75 25 Q 85 25 85 35 Q 85 45 75 45 L 25 45 Q 15 45 15 35 Q 15 25 25 25" />
          </svg>
        );
      case 'rounded-label':
        return (
          <svg {...baseProps}>
            <path d="M 10 5 L 80 5 Q 95 5 95 20 L 95 40 Q 95 55 80 55 L 10 55 Q 5 55 5 50 L 5 10 Q 5 5 10 5" />
          </svg>
        );
      case 'diamond':
        return (
          <svg {...baseProps}>
            <path d="M 50 5 L 95 30 L 50 55 L 5 30 Z" />
          </svg>
        );
      case 'arrow':
        return (
          <svg {...baseProps}>
            <path d="M 5 15 L 70 15 L 70 5 L 95 30 L 70 55 L 70 45 L 5 45 Z" />
          </svg>
        );
      case 'rounded-pill':
        return (
          <svg {...baseProps}>
            <rect x="5" y="10" width="90" height="40" rx="20" />
          </svg>
        );
      case 'simple-tab':
        return (
          <svg {...baseProps}>
            <path d="M 5 55 L 5 15 L 20 15 L 20 5 L 80 5 L 80 15 L 95 15 L 95 55 Z" />
          </svg>
        );
      case 'angled-tab':
        return (
          <svg {...baseProps}>
            <path d="M 5 55 L 5 20 L 25 5 L 75 5 L 95 20 L 95 55 Z" />
          </svg>
        );
      case 'wave':
        return (
          <svg {...baseProps}>
            <path d="M 5 20 Q 25 5 50 20 Q 75 35 95 20 L 95 55 L 5 55 Z" />
          </svg>
        );
      case 'hexagon':
        return (
          <svg {...baseProps}>
            <path d="M 25 5 L 75 5 L 95 30 L 75 55 L 25 55 L 5 30 Z" />
          </svg>
        );
      case 'organic':
        return (
          <svg {...baseProps}>
            <path d="M 20 15 Q 10 5 25 5 L 75 5 Q 90 5 90 20 Q 95 30 85 40 Q 90 55 70 55 L 30 55 Q 10 55 10 40 Q 5 30 15 20 Q 10 10 20 15" />
          </svg>
        );
      case 'curved':
        return (
          <svg {...baseProps}>
            <path d="M 5 5 L 95 5 Q 95 30 70 30 Q 50 30 50 45 Q 50 55 30 55 L 5 55 Z" />
          </svg>
        );
      case 'tag':
        return (
          <svg {...baseProps}>
            <path d="M 5 5 L 70 5 L 95 30 L 70 55 L 5 55 Z M 75 30 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0" />
          </svg>
        );
      case 'banner':
        return (
          <svg {...baseProps}>
            <path d="M 5 5 L 95 5 L 95 45 L 50 55 L 5 45 Z" />
          </svg>
        );
      case 'rounded-banner':
        return (
          <svg {...baseProps}>
            <path d="M 10 5 L 90 5 Q 95 5 95 10 L 95 40 L 50 55 L 5 40 L 5 10 Q 5 5 10 5" />
          </svg>
        );
      case 'shield':
        return (
          <svg {...baseProps}>
            <path d="M 50 5 L 95 15 L 95 35 Q 95 45 50 55 Q 5 45 5 35 L 5 15 Z" />
          </svg>
        );
      case 'bookmark':
        return (
          <svg {...baseProps}>
            <path d="M 20 5 L 80 5 L 80 55 L 50 40 L 20 55 Z" />
          </svg>
        );
      case 'curved-tab':
        return (
          <svg {...baseProps}>
            <path d="M 5 55 L 5 10 Q 5 5 10 5 L 40 5 Q 50 5 50 15 L 50 5 Q 50 5 60 5 L 90 5 Q 95 5 95 10 L 95 55 Z" />
          </svg>
        );
      case 'tab-corner':
        return (
          <svg {...baseProps}>
            <path d="M 5 25 L 25 5 L 95 5 L 95 55 L 5 55 Z" />
          </svg>
        );
      case 'scalloped':
        return (
          <svg {...baseProps}>
            <path d="M 5 10 Q 5 5 10 5 L 90 5 Q 95 5 95 10 Q 92 15 95 20 Q 92 25 95 30 Q 92 35 95 40 Q 92 45 95 50 Q 95 55 90 55 L 10 55 Q 5 55 5 50 Q 8 45 5 40 Q 8 35 5 30 Q 8 25 5 20 Q 8 15 5 10" />
          </svg>
        );
      case 'angled-scalloped':
        return (
          <svg {...baseProps}>
            <path d="M 5 5 L 95 5 L 95 40 Q 90 42 88 45 Q 86 48 85 50 L 85 55 L 5 55 Q 8 50 5 45 Q 8 40 5 35 Q 8 30 5 25 Q 8 20 5 15 Q 8 10 5 5" />
          </svg>
        );
      case 'octagon':
        return (
          <svg {...baseProps}>
            <path d="M 30 5 L 70 5 L 95 20 L 95 40 L 70 55 L 30 55 L 5 40 L 5 20 Z" />
          </svg>
        );
      case 'pentagon':
        return (
          <svg {...baseProps}>
            <path d="M 50 5 L 95 25 L 80 55 L 20 55 L 5 25 Z" />
          </svg>
        );
      case 'rounded-pentagon':
        return (
          <svg {...baseProps}>
            <path d="M 50 5 Q 55 5 60 8 L 90 25 Q 95 30 92 35 L 77 52 Q 75 55 70 55 L 30 55 Q 25 55 23 52 L 8 35 Q 5 30 10 25 L 40 8 Q 45 5 50 5" />
          </svg>
        );
      default:
        return (
          <svg {...baseProps}>
            <rect x="5" y="5" width="90" height="50" rx="3" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-10 text-gray-700">
              {selectedShape && getShapePath(selectedShape.shape)}
            </div>
            <span className="font-medium text-gray-900">
              {selectedShape?.name || 'Select Die Shape'}
            </span>
          </div>
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Die Shape
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Grid of Shapes */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {options.map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => handleSelect(shape.id)}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all hover:shadow-md
                        ${
                          selected === shape.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 bg-white'
                        }
                      `}
                    >
                      {/* Shape Preview */}
                      <div
                        className={`
                        w-full aspect-[5/3] mb-2
                        ${
                          selected === shape.id
                            ? 'text-blue-600'
                            : 'text-gray-700'
                        }
                      `}
                      >
                        {getShapePath(shape.shape)}
                      </div>

                      {/* Shape Name */}
                      <div
                        className={`
                        text-sm font-medium text-center
                        ${
                          selected === shape.id
                            ? 'text-blue-600'
                            : 'text-gray-700'
                        }
                      `}
                      >
                        {shape.name}
                      </div>

                      {/* Selected Indicator */}
                      {selected === shape.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

