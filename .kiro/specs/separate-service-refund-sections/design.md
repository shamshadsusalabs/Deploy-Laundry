# Design Document: Separate Service and Refund Sections

## Overview

This design document outlines the technical implementation for separating service items and refund items into distinct sections within the invoice system. The current implementation displays all items in a single combined table, making it difficult for users to distinguish between active services and refunded items. This enhancement will create two visually distinct sections: a Service Section for active items and a Refund Section for refunded items, improving invoice clarity and user experience.

The solution involves refactoring the existing `InvoiceDetailUpdated.tsx` component to implement separate rendering logic for service and refund items, while maintaining all existing functionality and data structures.

## Architecture

### Current Architecture
The existing invoice system uses a single-table approach where all items (services, manual items, and refunded items) are displayed together in one table. The current architecture includes:

- **InvoiceDetailUpdated.tsx**: Main component handling invoice display
- **IInvoice interface**: Data structure containing order items with refund flags
- **IOrderItem interface**: Individual item structure with `isRefunded` and `refundAmount` properties
- **Combined rendering**: All items rendered in a single table with inline refund indicators

### Proposed Architecture
The new architecture will maintain the existing data structures while implementing a dual-section rendering approach:

```
InvoiceDetailUpdated.tsx
├── ServiceSection Component
│   ├── ServiceItemsTable
│   ├── ServiceSubtotal
│   └── EmptyServiceState
├── RefundSection Component (conditional)
│   ├── RefundItemsTable
│   ├── RefundSubtotal
│   └── RefundSummary
└── Existing Components (unchanged)
    ├── Header
    ├── CompanyInfo
    ├── BillTo
    ├── InvoiceInfo
    └── PaymentInfo
```

### Data Flow
1. **Item Classification**: Filter `invoice.order.items` into active and refunded items
2. **Section Rendering**: Render ServiceSection for active items, RefundSection for refunded items
3. **Subtotal Calculation**: Calculate section-specific subtotals
4. **Responsive Layout**: Adapt sections for mobile and desktop views

## Components and Interfaces

### ServiceSection Component
```typescript
interface ServiceSectionProps {
  items: IOrderItem[];
  currency: string;
  deliveryDate?: string;
}

const ServiceSection: React.FC<ServiceSectionProps> = ({ items, currency, deliveryDate }) => {
  // Component implementation
};
```

**Responsibilities:**
- Display active service items in a dedicated table
- Show service-specific styling (blue theme)
- Calculate and display service subtotal
- Handle empty state when no services exist
- Maintain responsive design

### RefundSection Component
```typescript
interface RefundSectionProps {
  items: IOrderItem[];
  currency: string;
  deliveryDate?: string;
  totalRefundAmount: number;
}

const RefundSection: React.FC<RefundSectionProps> = ({ items, currency, deliveryDate, totalRefundAmount }) => {
  // Component implementation
};
```

**Responsibilities:**
- Display refunded items in a dedicated table
- Show refund-specific styling (red theme)
- Include refund reasons and amounts
- Calculate and display refund subtotal
- Only render when refunded items exist

### ItemTable Component (Shared)
```typescript
interface ItemTableProps {
  items: IOrderItem[];
  currency: string;
  deliveryDate?: string;
  sectionType: 'service' | 'refund';
  className?: string;
}

const ItemTable: React.FC<ItemTableProps> = ({ items, currency, deliveryDate, sectionType, className }) => {
  // Shared table implementation
};
```

**Responsibilities:**
- Provide reusable table structure for both sections
- Apply section-specific styling based on `sectionType`
- Handle responsive table layout
- Display item details consistently

### Updated InvoiceDetailUpdated Component
The main component will be refactored to:
- Filter items into active and refunded categories
- Render ServiceSection and RefundSection components
- Maintain existing header, company info, and payment sections
- Preserve all current functionality and data handling

## Data Models

### Item Classification Logic
```typescript
// Filter items into categories
const activeItems = allItems.filter(item => !item.isRefunded);
const refundedItems = allItems.filter(item => item.isRefunded);

// Further categorize active items
const activeServices = activeItems.filter(item => item.serviceType !== 'manual' && item.service);
const activeManualItems = activeItems.filter(item => item.serviceType === 'manual' || !item.service);
```

### Subtotal Calculations
```typescript
// Service section subtotal
const serviceSubtotal = activeItems.reduce((sum, item) => sum + item.subtotal, 0);

// Refund section total
const refundTotal = refundedItems.reduce((sum, item) => sum + (item.refundAmount || 0), 0);
```

### Enhanced IOrderItem Usage
The existing `IOrderItem` interface already contains the necessary fields:
- `isRefunded?: boolean` - Identifies refunded items
- `refundAmount?: number` - Refund amount for the item
- `refundReason?: string` - Reason for refund
- `refundReasonDescription?: string` - Additional refund details

No changes to data models are required.

## Implementation Details

### Component Structure

#### ServiceSection Component Implementation
```typescript
interface ServiceSectionProps {
  items: IOrderItem[];
  currency: string;
  deliveryDate?: string;
}

const ServiceSection: React.FC<ServiceSectionProps> = ({ items, currency, deliveryDate }) => {
  const serviceSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  if (!items || items.length === 0) {
    return (
      <div className="mb-8">
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h3 className="font-bold text-lg flex items-center gap-2">
            🔧 Active Services
          </h3>
        </div>
        <div className="border border-t-0 border-blue-200 bg-blue-50 p-8 rounded-b-lg text-center">
          <p className="text-blue-700">No active services on this invoice</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h3 className="font-bold text-lg flex items-center gap-2">
          🔧 Active Services
        </h3>
      </div>
      <div className="border border-t-0 border-blue-200 bg-white rounded-b-lg">
        <ItemTable 
          items={items}
          currency={currency}
          deliveryDate={deliveryDate}
          sectionType="service"
          className="border-blue-200"
        />
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex justify-between font-semibold text-blue-800">
            <span>Service Subtotal:</span>
            <span>{currency}{serviceSubtotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### RefundSection Component Implementation
```typescript
interface RefundSectionProps {
  items: IOrderItem[];
  currency: string;
  deliveryDate?: string;
  totalRefundAmount: number;
}

const RefundSection: React.FC<RefundSectionProps> = ({ 
  items, 
  currency, 
  deliveryDate, 
  totalRefundAmount 
}) => {
  if (!items || items.length === 0) {
    return null; // Don't render section if no refunded items
  }

  return (
    <div className="mb-8">
      <div className="bg-red-600 text-white p-4 rounded-t-lg">
        <h3 className="font-bold text-lg flex items-center gap-2">
          🔄 Refunded Items
        </h3>
      </div>
      <div className="border border-t-0 border-red-200 bg-white rounded-b-lg">
        <ItemTable 
          items={items}
          currency={currency}
          deliveryDate={deliveryDate}
          sectionType="refund"
          className="border-red-200"
        />
        <div className="p-4 bg-red-50 border-t border-red-200">
          <div className="flex justify-between font-semibold text-red-800">
            <span>Total Refunded:</span>
            <span>-{currency}{totalRefundAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### Shared ItemTable Component
```typescript
interface ItemTableProps {
  items: IOrderItem[];
  currency: string;
  deliveryDate?: string;
  sectionType: 'service' | 'refund';
  className?: string;
}

const ItemTable: React.FC<ItemTableProps> = ({ 
  items, 
  currency, 
  deliveryDate, 
  sectionType,
  className = ''
}) => {
  const getRowHoverClass = () => {
    return sectionType === 'service' ? 'hover:bg-blue-50' : 'hover:bg-red-50';
  };

  const getItemTypeIndicator = (item: IOrderItem) => {
    if (sectionType === 'service') {
      return <p className="text-xs text-blue-600">🔧 Service - {item.serviceType}</p>;
    } else {
      return (
        <div>
          <p className="text-xs text-red-600">🔄 Refunded: {currency}{item.refundAmount}</p>
          {item.refundReason && (
            <p className="text-xs text-red-500">Reason: {item.refundReason}</p>
          )}
        </div>
      );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className={`w-full border ${className}`}>
        <thead>
          <tr className={sectionType === 'service' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}>
            <th className="text-left py-3 px-4 font-semibold">Delivery Date</th>
            <th className="text-left py-3 px-4 font-semibold">Item Name</th>
            <th className="text-center py-3 px-4 font-semibold">Qty</th>
            <th className="text-right py-3 px-4 font-semibold">Rate</th>
            <th className="text-right py-3 px-4 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={`${sectionType}-${idx}`} className={`border-b ${className} ${getRowHoverClass()}`}>
              <td className="py-3 px-4 text-sm text-slate-700">
                {deliveryDate ? new Date(deliveryDate).toLocaleDateString() : ''}
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium text-slate-900">{item.serviceName || item.itemName}</p>
                  {getItemTypeIndicator(item)}
                </div>
              </td>
              <td className="text-center py-3 px-4 font-medium text-slate-900">{item.quantity}</td>
              <td className="text-right py-3 px-4 text-slate-900">{currency}{item.pricePerUnit.toLocaleString()}</td>
              <td className="text-right py-3 px-4 font-bold text-slate-900">{currency}{item.subtotal.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Mobile Responsive Adaptations

#### Mobile Table Layout
For mobile devices, the table will adapt to show essential information in a card-like format:

```typescript
const MobileItemCard: React.FC<{item: IOrderItem, currency: string, sectionType: 'service' | 'refund'}> = ({ 
  item, 
  currency, 
  sectionType 
}) => {
  const cardClass = sectionType === 'service' ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50';
  
  return (
    <div className={`p-4 border rounded-lg mb-3 ${cardClass}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-slate-900">{item.serviceName || item.itemName}</h4>
        <span className="font-bold text-slate-900">{currency}{item.subtotal.toLocaleString()}</span>
      </div>
      <div className="text-sm text-slate-600">
        <p>Qty: {item.quantity} × {currency}{item.pricePerUnit.toLocaleString()}</p>
        {sectionType === 'refund' && item.refundAmount && (
          <p className="text-red-600">Refunded: {currency}{item.refundAmount}</p>
        )}
      </div>
    </div>
  );
};
```

### Integration with Existing Invoice Component

The main `InvoiceDetailUpdated` component will be updated to use the new sections:

```typescript
// Replace the existing items table section with:
const allItems = [...(invoice.order?.items || [])];
const activeItems = allItems.filter(item => !item.isRefunded);
const refundedItems = allItems.filter(item => item.isRefunded);

// In the JSX, replace the current table with:
<>
  <ServiceSection 
    items={activeItems}
    currency={currency}
    deliveryDate={invoice.order?.deliveryDate}
  />
  
  <RefundSection 
    items={refundedItems}
    currency={currency}
    deliveryDate={invoice.order?.deliveryDate}
    totalRefundAmount={invoice.totalRefundAmount || 0}
  />
</>
```

## Migration Strategy

### Backward Compatibility
- Existing API endpoints and data structures remain unchanged
- Current invoice functionality is preserved
- Print/PDF generation continues to work with new layout
- No database schema changes required

### Deployment Approach
1. **Phase 1**: Deploy new components alongside existing table (feature flag)
2. **Phase 2**: A/B test with subset of users
3. **Phase 3**: Full rollout after validation
4. **Phase 4**: Remove old table implementation

### Rollback Plan
- Feature flag allows instant rollback to original table
- No data migration required for rollback
- Component isolation ensures minimal impact

## Performance Considerations

### Rendering Optimization
- Memoize section components to prevent unnecessary re-renders
- Use React.memo for ItemTable component
- Implement virtual scrolling for invoices with many items

### Bundle Size Impact
- New components add minimal JavaScript overhead (~2-3KB gzipped)
- CSS changes are incremental additions to existing styles
- No new external dependencies required

## Error Handling

### Data Validation
- **Null/Undefined Checks**: Validate `invoice.order?.items` exists before processing
- **Item Validation**: Ensure each item has required fields before rendering
- **Subtotal Validation**: Handle cases where subtotal calculations might be invalid

### Fallback Rendering
- **Empty States**: Display appropriate messages when sections have no items
- **Missing Data**: Gracefully handle missing item properties
- **Calculation Errors**: Provide fallback values for failed calculations

### Error Boundaries
```typescript
// Component-level error handling
const ServiceSection: React.FC<ServiceSectionProps> = ({ items, currency, deliveryDate }) => {
  try {
    if (!items || items.length === 0) {
      return <EmptyServiceState />;
    }
    // Render service items
  } catch (error) {
    console.error('ServiceSection render error:', error);
    return <div className="text-red-600">Error displaying service items</div>;
  }
};
```

## Security Considerations

### Data Sanitization
- All user-provided data (item names, descriptions) will be sanitized before rendering
- Currency amounts validated as numbers before display
- XSS prevention through React's built-in escaping

### Access Control
- No changes to existing authentication/authorization
- Invoice access permissions remain unchanged
- Component-level security inherits from parent invoice view

## Monitoring and Analytics

### Performance Metrics
- Track component render times for large invoices
- Monitor bundle size impact on page load
- Measure user interaction patterns with new sections

### User Experience Metrics
- Time to find specific items (A/B test vs. current design)
- User satisfaction scores for invoice clarity
- Support ticket reduction related to invoice confusion

### Error Tracking
- Component render failures
- Calculation errors in subtotals
- Mobile responsive layout issues

## Future Enhancements

### Phase 2 Improvements
- **Collapsible Sections**: Allow users to collapse/expand sections
- **Item Filtering**: Filter items by type, date, or amount within sections
- **Export Options**: Export individual sections to CSV/PDF
- **Bulk Actions**: Select multiple items for batch operations

### Advanced Features
- **Section Customization**: Allow users to reorder or hide sections
- **Enhanced Mobile UX**: Swipe gestures for section navigation
- **Real-time Updates**: Live updates when refunds are processed
- **Integration**: Connect with accounting software for section-specific exports

## Conclusion

This design provides a comprehensive solution for separating service and refund items into distinct, visually differentiated sections within the invoice system. The approach maintains backward compatibility while significantly improving user experience through:

1. **Clear Visual Hierarchy**: Color-coded sections with distinct themes
2. **Improved Readability**: Separated concerns reduce cognitive load
3. **Enhanced Accessibility**: WCAG 2.1 AA compliance throughout
4. **Mobile Optimization**: Responsive design for all device types
5. **Maintainable Architecture**: Modular components with clear responsibilities

The implementation leverages existing data structures and APIs, ensuring minimal disruption to current operations while providing substantial user experience improvements. The phased rollout approach allows for validation and refinement before full deployment.

Key success metrics will include reduced support tickets related to invoice confusion, improved user satisfaction scores, and faster invoice processing times for both internal staff and customers.

## Visual Design System

### Color Hierarchy and Visual Differentiation
Based on research into invoice design best practices and visual hierarchy principles, the separated sections will use a clear color-coding system to enhance user comprehension:

**Service Section (Active Items):**
- **Primary Color**: Blue theme (`bg-blue-600`, `text-blue-600`, `border-blue-200`)
- **Visual Indicators**: 
  - Blue header background for section title
  - Blue accent borders and hover states
  - Service icon: 🔧 (gear/tool icon)
  - Positive visual cues (green accents for active status)

**Refund Section (Refunded Items):**
- **Primary Color**: Red theme (`bg-red-600`, `text-red-600`, `border-red-200`)
- **Visual Indicators**:
  - Red header background for section title
  - Red accent borders and backgrounds
  - Refund icon: 🔄 (circular arrow icon)
  - Warning/attention visual cues

**Design Principles Applied:**
1. **Clear Visual Hierarchy**: Section headers use bold typography and contrasting backgrounds
2. **Color Psychology**: Blue conveys trust and active services, red indicates refunds/attention needed
3. **Sufficient Contrast**: All text maintains WCAG AA contrast ratios for accessibility
4. **Consistent Spacing**: Uniform margins and padding between sections (2rem gap)
5. **Scannable Layout**: Important information (amounts, totals) prominently displayed

### Section Layout Structure
```
┌─────────────────────────────────────────┐
│ 🔧 ACTIVE SERVICES (Blue Header)        │
├─────────────────────────────────────────┤
│ Service Items Table                     │
│ - Blue hover states                     │
│ - Service type indicators               │
├─────────────────────────────────────────┤
│ Service Subtotal: $XXX                 │
└─────────────────────────────────────────┘

        ↓ (2rem spacing)

┌─────────────────────────────────────────┐
│ 🔄 REFUNDED ITEMS (Red Header)          │
├─────────────────────────────────────────┤
│ Refund Items Table                      │
│ - Red hover states                      │
│ - Refund reason indicators              │
├─────────────────────────────────────────┤
│ Total Refunded: -$XXX                  │
└─────────────────────────────────────────┘
```

### Responsive Design Considerations
- **Desktop**: Side-by-side sections when space allows
- **Tablet**: Stacked sections with full width
- **Mobile**: Simplified table layout with essential columns only
- **Print**: Grayscale-friendly design with clear section borders

## Testing Strategy

### Unit Testing Approach
The testing strategy will focus on component-level testing and integration testing to ensure the separated sections work correctly:

**Component Testing:**
- Test ServiceSection renders correctly with various item configurations
- Test RefundSection displays refunded items with proper styling
- Test empty state handling for both sections
- Test responsive behavior on different screen sizes
- Test subtotal calculations for accuracy
- Test color accessibility and contrast ratios

**Integration Testing:**
- Test the complete invoice display with mixed active and refunded items
- Test invoice display with only active items (no refund section)
- Test invoice display with only refunded items
- Test data flow from API to component rendering
- Test print/PDF layout compatibility

**Visual Regression Testing:**
- Snapshot tests for section layouts and styling
- Color theme consistency across sections
- Mobile responsive layout verification
- Print/PDF layout compatibility testing

**Accessibility Testing:**
- Screen reader compatibility for section headers
- Keyboard navigation between sections
- Color contrast validation
- Focus management and visual indicators

**Example Test Cases:**
```typescript
describe('ServiceSection', () => {
  it('should render active service items with blue theme', () => {
    // Test blue color scheme application
  });
  
  it('should display empty state when no services exist', () => {
    // Test empty state message and styling
  });
  
  it('should calculate service subtotal correctly', () => {
    // Test subtotal calculation accuracy
  });
  
  it('should maintain accessibility standards', () => {
    // Test color contrast and screen reader compatibility
  });
});

describe('RefundSection', () => {
  it('should render refunded items with red theme', () => {
    // Test red color scheme application
  });
  
  it('should not render when no refunded items exist', () => {
    // Test conditional rendering logic
  });
  
  it('should display refund reasons and amounts prominently', () => {
    // Test refund information display
  });
  
  it('should handle mobile responsive layout', () => {
    // Test mobile table layout adaptation
  });
});

describe('InvoiceDetailUpdated Integration', () => {
  it('should maintain visual hierarchy between sections', () => {
    // Test section ordering and spacing
  });
  
  it('should preserve existing invoice functionality', () => {
    // Test backward compatibility
  });
});
```

The testing approach emphasizes example-based unit tests and integration tests rather than property-based testing, as this feature involves UI rendering and specific business logic that is better validated through concrete test scenarios.