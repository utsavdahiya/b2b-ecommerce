# Category Configuration System

This system allows you to define dynamic filter configurations for each product category. The filters are stored in the `category_config` table and can be customized for different categories like Visiting Cards, Brochures, etc.

## Table Structure

The `category_config` table contains:

- **id**: Primary key
- **category**: Unique category name (e.g., "Visiting Cards")
- **filters**: JSONB column containing filter definitions
- **description**: Optional description of the category configuration
- **created_at**: Timestamp of creation
- **updated_at**: Timestamp of last update

## Filter Schema

Each filter in the `filters` JSONB object should follow this structure:

```json
{
  "filterKey": {
    "label": "Display Label",
    "type": "select | die_shape_selector | text | number",
    "options": ["option1", "option2"] or [{"id": "id1", "name": "Name", "shape": "shape"}],
    "required": true | false,
    "default": "defaultValue"
  }
}
```

## Example: Visiting Cards Configuration

```json
{
  "printing": {
    "label": "Printing",
    "type": "select",
    "options": ["Single Side", "Both Side"],
    "required": true
  },
  "uv": {
    "label": "UV",
    "type": "select",
    "options": ["Front", "Back", "Both", "NA"],
    "required": true,
    "default": "NA"
  },
  "foil": {
    "label": "Foil",
    "type": "select",
    "options": ["Front", "Back", "Both", "NA"],
    "required": true,
    "default": "NA"
  },
  "dieShape": {
    "label": "Die Shape",
    "type": "die_shape_selector",
    "options": [
      {"id": "die-1", "name": "DIE-1", "shape": "rectangle"},
      {"id": "die-2", "name": "DIE-2", "shape": "rounded-rectangle"}
    ],
    "required": false,
    "default": "die-1"
  }
}
```

## Applying the Migration

To add the `category_config` table to your database:

```bash
# Set your DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run the migration script
node lib/db/migrations/apply_category_config_migration.js
```

Or if you're starting fresh:

```bash
# The category_config table is already included in schema.sql
psql $DATABASE_URL < lib/db/schema.sql
psql $DATABASE_URL < lib/db/seed.sql
```

## Service Usage

The `categoryConfigService` provides methods to interact with category configurations:

```typescript
import { categoryConfigService } from '@/lib/services/categoryConfigService';

// Get configuration for a specific category
const config = await categoryConfigService.getByCategory('Visiting Cards');

// Get all category configurations
const allConfigs = await categoryConfigService.getAll();

// Create a new category configuration
const newConfig = await categoryConfigService.create(
  'Brochures',
  {
    size: {
      label: 'Size',
      type: 'select',
      options: ['A4', 'A5', 'Letter'],
      required: true
    }
  },
  'Filter configuration for brochures'
);

// Update existing configuration
const updated = await categoryConfigService.update(
  'Visiting Cards',
  { /* updated filters */ }
);

// Upsert (create or update)
const config = await categoryConfigService.upsert(
  'Pamphlets',
  { /* filters */ }
);

// Delete a configuration
const success = await categoryConfigService.delete('Category Name');

// Check if configuration exists
const exists = await categoryConfigService.hasConfig('Visiting Cards');
```

## API Endpoints

### GET /api/category-config

Get all category configurations or a specific one:

```bash
# Get all configurations
curl http://localhost:3000/api/category-config

# Get specific category configuration
curl http://localhost:3000/api/category-config?category=Visiting%20Cards
```

### POST /api/category-config

Create a new category configuration:

```bash
curl -X POST http://localhost:3000/api/category-config \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Brochures",
    "filters": {
      "size": {
        "label": "Size",
        "type": "select",
        "options": ["A4", "A5"],
        "required": true
      }
    },
    "description": "Brochure filters"
  }'
```

### PUT /api/category-config

Update (or create) a category configuration:

```bash
curl -X PUT http://localhost:3000/api/category-config \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Visiting Cards",
    "filters": { /* updated filters */ }
  }'
```

### DELETE /api/category-config

Delete a category configuration:

```bash
curl -X DELETE "http://localhost:3000/api/category-config?category=Visiting%20Cards"
```

## Using the Die Shape Selector Component

The `DieShapeSelector` component provides a visual interface for selecting die shapes:

```tsx
import DieShapeSelector from '@/components/DieShapeSelector';

function ProductForm() {
  const [selectedShape, setSelectedShape] = useState('die-1');

  const dieShapeOptions = [
    { id: 'die-1', name: 'DIE-1', shape: 'rectangle' },
    { id: 'die-2', name: 'DIE-2', shape: 'rounded-rectangle' },
    // ... more shapes
  ];

  return (
    <DieShapeSelector
      options={dieShapeOptions}
      selected={selectedShape}
      onChange={setSelectedShape}
      disabled={false}
    />
  );
}
```

## Filter Types

### 1. Select Filter
Standard dropdown selection:
```json
{
  "type": "select",
  "options": ["Option 1", "Option 2"]
}
```

### 2. Die Shape Selector
Visual shape picker with modal:
```json
{
  "type": "die_shape_selector",
  "options": [
    {"id": "die-1", "name": "DIE-1", "shape": "rectangle"}
  ]
}
```

### 3. Text Filter
Text input field:
```json
{
  "type": "text",
  "required": false
}
```

### 4. Number Filter
Number input field:
```json
{
  "type": "number",
  "required": false
}
```

## Available Die Shapes

The system includes 36 predefined die shapes:

- **DIE-1**: rectangle
- **DIE-2**: rounded-rectangle
- **DIE-3**: rounded-corners
- **DIE-4**: rounded-top
- **DIE-5**: angled-corner
- **DIE-6**: tab-right
- **DIE-7**: tab-left
- **DIE-8**: oval
- **DIE-9**: ellipse
- **DIE-10**: rounded-badge
- **DIE-11**: house
- **DIE-12**: ticket
- **DIE-13**: label
- **DIE-14**: cloud
- **DIE-15**: rounded-label
- **DIE-16**: diamond
- **DIE-17**: arrow
- **DIE-18**: rounded-pill
- **DIE-19**: simple-tab
- **DIE-20**: angled-tab
- **DIE-21**: wave
- **DIE-22**: hexagon
- **DIE-23**: organic
- **DIE-24**: curved
- **DIE-25**: tag
- **DIE-26**: banner
- **DIE-27**: rounded-banner
- **DIE-28**: shield
- **DIE-29**: bookmark
- **DIE-30**: curved-tab
- **DIE-31**: tab-corner
- **DIE-32**: scalloped
- **DIE-33**: angled-scalloped
- **DIE-34**: octagon
- **DIE-35**: pentagon
- **DIE-36**: rounded-pentagon

## Adding New Categories

To add a new category with filters:

1. Use the service:
```typescript
await categoryConfigService.create(
  'New Category',
  {
    filter1: { /* filter config */ },
    filter2: { /* filter config */ }
  }
);
```

2. Or use the API:
```bash
curl -X POST http://localhost:3000/api/category-config \
  -H "Content-Type: application/json" \
  -d '{ "category": "New Category", "filters": {...} }'
```

3. Or add directly to the database:
```sql
INSERT INTO category_config (category, filters, description)
VALUES ('New Category', '{ "filter": {...} }'::jsonb, 'Description');
```

## Integration with Product Details Page

To integrate filters on the product details page:

1. Fetch category configuration:
```typescript
const response = await fetch(`/api/category-config?category=${product.category}`);
const { data: config } = await response.json();
```

2. Render filters dynamically based on configuration:
```tsx
{config?.filters && Object.entries(config.filters).map(([key, filter]) => (
  <div key={key}>
    <label>{filter.label}</label>
    {filter.type === 'select' && (
      <select>
        {filter.options.map(opt => <option key={opt}>{opt}</option>)}
      </select>
    )}
    {filter.type === 'die_shape_selector' && (
      <DieShapeSelector
        options={filter.options}
        selected={formData[key]}
        onChange={(value) => setFormData({...formData, [key]: value})}
      />
    )}
  </div>
))}
```

## Notes

- The `filters` column uses PostgreSQL's JSONB type for efficient storage and querying
- Filters are validated on the client side based on the `required` field
- Each category can have unique filters tailored to its specific needs
- The die shape selector includes visual SVG representations of each shape
- All changes are timestamped automatically via database triggers

