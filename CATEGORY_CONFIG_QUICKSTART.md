# Quick Start: Category Config Implementation

## What Was Added

✅ **Database Table**: `category_config` table to store category-specific filter configurations
✅ **Service Layer**: `categoryConfigService.ts` for CRUD operations
✅ **API Routes**: `/api/category-config` for REST operations
✅ **UI Component**: `DieShapeSelector.tsx` - Beautiful modal-based shape picker with 36 die shapes
✅ **Migration Script**: Automated database migration
✅ **Seed Data**: Pre-configured filters for Visiting Cards category

## How to Apply Changes

### Option 1: Run Migration Script (Recommended)

```bash
# Make sure DATABASE_URL is set in your .env
node lib/db/migrations/apply_category_config_migration.js
```

### Option 2: Fresh Database Setup

```bash
# If you're rebuilding the database from scratch
psql $DATABASE_URL < lib/db/schema.sql
psql $DATABASE_URL < lib/db/seed.sql
```

## Example: Using in Product Details Page

Here's how to integrate dynamic filters on your product page:

```typescript
'use client';

import { useState, useEffect } from 'react';
import DieShapeSelector from '@/components/DieShapeSelector';

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState(null);
  const [categoryConfig, setCategoryConfig] = useState(null);
  const [formData, setFormData] = useState({});

  // Fetch product and category configuration
  useEffect(() => {
    async function loadData() {
      // Load product
      const productRes = await fetch(`/api/products/${params.id}`);
      const productData = await productRes.json();
      setProduct(productData);

      // Load category filters
      const configRes = await fetch(
        `/api/category-config?category=${encodeURIComponent(productData.category)}`
      );
      if (configRes.ok) {
        const configData = await configRes.json();
        setCategoryConfig(configData.data);
        
        // Set default values
        const defaults = {};
        Object.entries(configData.data.filters).forEach(([key, filter]) => {
          if (filter.default) {
            defaults[key] = filter.default;
          }
        });
        setFormData(defaults);
      }
    }
    loadData();
  }, [params.id]);

  const handleFilterChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <h1>{product?.name}</h1>
      
      {/* Render dynamic filters based on category configuration */}
      {categoryConfig?.filters && (
        <div className="space-y-4">
          {Object.entries(categoryConfig.filters).map(([key, filter]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-2">
                {filter.label}
                {filter.required && <span className="text-red-500">*</span>}
              </label>

              {/* Select Dropdown */}
              {filter.type === 'select' && (
                <select
                  value={formData[key] || ''}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required={filter.required}
                >
                  <option value="">Select {filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {/* Die Shape Selector */}
              {filter.type === 'die_shape_selector' && (
                <DieShapeSelector
                  options={filter.options}
                  selected={formData[key] || filter.default}
                  onChange={(value) => handleFilterChange(key, value)}
                />
              )}

              {/* Text Input */}
              {filter.type === 'text' && (
                <input
                  type="text"
                  value={formData[key] || ''}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required={filter.required}
                />
              )}

              {/* Number Input */}
              {filter.type === 'number' && (
                <input
                  type="number"
                  value={formData[key] || ''}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required={filter.required}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Pre-configured Filters for Visiting Cards

The system comes pre-configured with filters for the "Visiting Cards" category:

### 1. Printing (Required)
- Options: Single Side, Both Side
- Type: Select dropdown

### 2. UV Coating (Required)
- Options: Front, Back, Both, NA
- Default: NA
- Type: Select dropdown

### 3. Foil Stamping (Required)
- Options: Front, Back, Both, NA
- Default: NA
- Type: Select dropdown

### 4. Die Shape (Optional)
- Options: 36 different die shapes (DIE-1 through DIE-36)
- Default: die-1 (rectangle)
- Type: Visual shape selector with modal
- Shapes include: rectangles, ovals, arrows, shields, tags, and more

## Adding More Categories

To add filters for other categories (Brochures, Pamphlets, etc.):

### Using the API:

```bash
curl -X POST http://localhost:3000/api/category-config \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Brochures",
    "filters": {
      "size": {
        "label": "Size",
        "type": "select",
        "options": ["A4", "A5", "Letter"],
        "required": true
      },
      "fold": {
        "label": "Fold Type",
        "type": "select",
        "options": ["No Fold", "Half Fold", "Tri-Fold", "Z-Fold"],
        "required": true
      },
      "finish": {
        "label": "Finish",
        "type": "select",
        "options": ["Matte", "Glossy", "Laminated"],
        "required": false,
        "default": "Matte"
      }
    },
    "description": "Filter configuration for Brochures"
  }'
```

### Using the Service:

```typescript
import { categoryConfigService } from '@/lib/services/categoryConfigService';

await categoryConfigService.create(
  'Pamphlets',
  {
    paperWeight: {
      label: 'Paper Weight',
      type: 'select',
      options: ['100gsm', '150gsm', '200gsm'],
      required: true,
      default: '150gsm'
    },
    color: {
      label: 'Color',
      type: 'select',
      options: ['Full Color', 'Black & White'],
      required: true
    }
  },
  'Filter configuration for Pamphlets'
);
```

## Testing the Feature

1. **Apply the migration**:
   ```bash
   node lib/db/migrations/apply_category_config_migration.js
   ```

2. **Test the API**:
   ```bash
   # Get Visiting Cards configuration
   curl http://localhost:3000/api/category-config?category=Visiting%20Cards
   ```

3. **Import and use the component**:
   ```tsx
   import DieShapeSelector from '@/components/DieShapeSelector';
   ```

4. **Check the database**:
   ```sql
   SELECT * FROM category_config;
   ```

## Files Created/Modified

### New Files:
- ✅ `lib/db/migrations/add_category_config_table.sql` - Migration SQL
- ✅ `lib/db/migrations/apply_category_config_migration.js` - Migration script
- ✅ `lib/services/categoryConfigService.ts` - Service layer
- ✅ `components/DieShapeSelector.tsx` - Die shape selector component
- ✅ `app/api/category-config/route.ts` - API endpoints
- ✅ `CATEGORY_CONFIG_README.md` - Comprehensive documentation
- ✅ `CATEGORY_CONFIG_QUICKSTART.md` - This quick start guide

### Modified Files:
- ✅ `lib/db/schema.sql` - Added category_config table
- ✅ `lib/db/seed.sql` - Added Visiting Cards configuration

## Next Steps

1. Run the migration to add the table
2. Start your dev server: `npm run dev`
3. Navigate to a product details page
4. Integrate the dynamic filters using the example code above
5. Test the die shape selector modal
6. Add configurations for other categories as needed

## Support

For more detailed information, see `CATEGORY_CONFIG_README.md`.

