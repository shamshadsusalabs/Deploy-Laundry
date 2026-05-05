# Implementation Plan: Separate Service and Refund Sections

## Overview

This implementation plan breaks down the creation of separate service and refund sections within the invoice system. The approach involves creating reusable components (ServiceSection, RefundSection, and shared ItemTable) and integrating them into the existing InvoiceDetailUpdated component while maintaining backward compatibility and responsive design.

## Tasks

- [x] 1. Create shared ItemTable component
  - Create `src/components/invoice/ItemTable.tsx` with TypeScript interfaces
  - Implement responsive table structure with section-specific styling
  - Add mobile card layout adaptation for small screens
  - Include hover states and visual indicators based on section type
  - _Requirements: 1.4, 2.4, 8.1, 8.3_

- [ ]* 1.1 Write unit tests for ItemTable component
  - Test table rendering with different item types
  - Test responsive behavior and mobile card layout
  - Test section-specific styling application
  - _Requirements: 1.4, 2.4, 8.1_

- [ ] 2. Implement ServiceSection component
  - [x] 2.1 Create ServiceSection component with blue theme styling
    - Create `src/components/invoice/ServiceSection.tsx`
    - Implement blue color scheme (bg-blue-600, border-blue-200)
    - Add service icon and section header
    - _Requirements: 1.1, 1.2, 3.1, 3.4_

  - [x] 2.2 Add service subtotal calculation and display
    - Calculate subtotal for active service items
    - Display subtotal in blue-themed footer section
    - Format currency display consistently
    - _Requirements: 6.1, 6.4_

  - [x] 2.3 Implement empty state handling for services
    - Display user-friendly message when no services exist
    - Maintain blue theme consistency in empty state
    - _Requirements: 1.5, 7.1, 7.3_

  - [ ]* 2.4 Write unit tests for ServiceSection
    - Test blue theme application and visual styling
    - Test subtotal calculation accuracy
    - Test empty state rendering and messaging
    - _Requirements: 1.1, 1.2, 6.1, 7.1_

- [ ] 3. Implement RefundSection component
  - [x] 3.1 Create RefundSection component with red theme styling
    - Create `src/components/invoice/RefundSection.tsx`
    - Implement red color scheme (bg-red-600, border-red-200)
    - Add refund icon and section header
    - _Requirements: 2.1, 2.2, 3.2, 3.5_

  - [x] 3.2 Add refund-specific information display
    - Display refund amounts and refund reasons
    - Show refund-specific indicators in item rows
    - Format refund amounts with negative values
    - _Requirements: 2.5, 2.6_

  - [x] 3.3 Implement refund total calculation and display
    - Calculate total refunded amount for all refunded items
    - Display total in red-themed footer section
    - Show negative formatting for refund amounts
    - _Requirements: 6.2, 6.4_

  - [x] 3.4 Add conditional rendering logic
    - Only render RefundSection when refunded items exist
    - Hide section completely when no refunds present
    - _Requirements: 2.6, 7.2_

  - [ ]* 3.5 Write unit tests for RefundSection
    - Test red theme application and visual styling
    - Test refund information display and formatting
    - Test conditional rendering logic
    - Test refund total calculation accuracy
    - _Requirements: 2.1, 2.2, 2.5, 6.2_

- [x] 4. Checkpoint - Ensure component tests pass
  - Ensure all component tests pass, ask the user if questions arise.

- [ ] 5. Integrate components into InvoiceDetailUpdated
  - [x] 5.1 Add item classification logic
    - Filter invoice items into active and refunded categories
    - Implement data flow from invoice props to section components
    - Preserve existing data structures and API compatibility
    - _Requirements: 5.3, 5.5_

  - [x] 5.2 Replace existing table with new sections
    - Remove current combined items table
    - Add ServiceSection and RefundSection components
    - Maintain proper section ordering (services first, then refunds)
    - _Requirements: 4.1, 4.3_

  - [x] 5.3 Implement responsive layout and spacing
    - Add proper margins and padding between sections
    - Ensure consistent alignment within invoice layout
    - Test responsive behavior on different screen sizes
    - _Requirements: 4.2, 4.4, 8.1, 8.2_

  - [ ]* 5.4 Write integration tests for invoice display
    - Test complete invoice rendering with mixed items
    - Test invoice with only active items (no refund section)
    - Test invoice with only refunded items
    - Test responsive layout behavior
    - _Requirements: 4.1, 4.3, 8.1_

- [ ] 6. Implement mobile responsive enhancements
  - [x] 6.1 Create mobile card layout for ItemTable
    - Implement MobileItemCard component for small screens
    - Show essential information in card format
    - Maintain section-specific styling in mobile view
    - _Requirements: 8.3, 8.4_

  - [x] 6.2 Add mobile-specific interactions
    - Ensure touch-friendly interface elements
    - Test mobile navigation and scrolling behavior
    - Verify readability on small screens
    - _Requirements: 8.5_

  - [ ]* 6.3 Write mobile responsive tests
    - Test mobile card layout rendering
    - Test touch interactions and navigation
    - Test readability and usability on mobile devices
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 7. Add error handling and validation
  - [x] 7.1 Implement component-level error boundaries
    - Add try-catch blocks in component render methods
    - Provide fallback UI for component render failures
    - Log errors for debugging and monitoring
    - _Requirements: 5.4_

  - [x] 7.2 Add data validation for item processing
    - Validate invoice.order?.items exists before filtering
    - Handle missing or invalid item properties gracefully
    - Provide fallback values for calculation errors
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 7.3 Write error handling tests
    - Test component behavior with invalid data
    - Test error boundary functionality
    - Test graceful degradation scenarios
    - _Requirements: 5.4_

- [ ] 8. Final integration and testing
  - [x] 8.1 Verify backward compatibility
    - Test existing invoice functionality remains intact
    - Verify API compatibility and data structure preservation
    - Test print/PDF generation with new layout
    - _Requirements: 5.4, 5.5_

  - [x] 8.2 Perform visual regression testing
    - Compare new layout with design specifications
    - Verify color themes and visual differentiation
    - Test section spacing and alignment
    - _Requirements: 3.1, 3.2, 4.2_

  - [ ]* 8.3 Write end-to-end integration tests
    - Test complete user workflow with separated sections
    - Test data flow from API to component rendering
    - Test responsive behavior across device types
    - _Requirements: 1.1, 2.1, 4.1, 8.1_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Components use TypeScript interfaces for type safety
- Blue theme for ServiceSection, red theme for RefundSection
- Backward compatibility maintained throughout implementation
- Mobile-first responsive design approach
- Error handling ensures graceful degradation
- Integration preserves existing invoice functionality

## Implementation Order

1. **Foundation**: Create shared ItemTable component with responsive design
2. **Service Section**: Implement ServiceSection with blue theme and subtotals
3. **Refund Section**: Implement RefundSection with red theme and conditional rendering
4. **Integration**: Replace existing table in InvoiceDetailUpdated component
5. **Mobile Enhancement**: Add mobile-specific responsive features
6. **Error Handling**: Add validation and error boundaries
7. **Final Testing**: Verify complete functionality and backward compatibility

## Key Technical Considerations

- **TypeScript**: All components use proper TypeScript interfaces and type safety
- **React Patterns**: Functional components with hooks for state management
- **Styling**: Tailwind CSS classes for consistent theming and responsive design
- **Performance**: Memoization and efficient rendering for large invoice items
- **Accessibility**: WCAG 2.1 AA compliance with proper color contrast and navigation
- **Testing**: Unit tests for components, integration tests for complete workflows