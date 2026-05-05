# Requirements Document

## Introduction

This feature enhances the invoice system by separating service items and refund items into distinct, clearly organized sections or tables. Currently, all items (services and refunds) are displayed together, making it difficult for users to quickly distinguish between active services and refunded items. This separation will improve invoice clarity, readability, and user experience.

## Glossary

- **Invoice_System**: The application component responsible for displaying invoice details and item information
- **Service_Item**: An active service or product item that appears on the invoice (not refunded)
- **Refund_Item**: An item that has been refunded and should be displayed separately from active items
- **Service_Section**: A dedicated display area showing only active service items
- **Refund_Section**: A dedicated display area showing only refunded items
- **Item_Table**: A structured display format (table) for presenting item information
- **Invoice_Detail_View**: The screen/page where users view complete invoice information

## Requirements

### Requirement 1: Separate Service Items Display

**User Story:** As a user viewing an invoice, I want to see active service items in their own dedicated section, so that I can clearly identify what services are currently active on the invoice.

#### Acceptance Criteria

1. THE Invoice_System SHALL display all non-refunded service items in a dedicated Service_Section
2. THE Service_Section SHALL be visually distinct from other sections with appropriate styling and headers
3. WHEN service items exist, THE Service_Section SHALL include a clear section title indicating "Services" or "Active Services"
4. THE Service_Section SHALL display service items in a structured Item_Table format
5. WHEN no service items exist, THE Service_Section SHALL display an appropriate empty state message

### Requirement 2: Separate Refund Items Display

**User Story:** As a user viewing an invoice, I want to see refunded items in their own dedicated section, so that I can clearly identify what items have been refunded without confusion with active services.

#### Acceptance Criteria

1. THE Invoice_System SHALL display all refunded items in a dedicated Refund_Section
2. THE Refund_Section SHALL be visually distinct from the Service_Section with different styling and colors
3. WHEN refunded items exist, THE Refund_Section SHALL include a clear section title indicating "Refunds" or "Refunded Items"
4. THE Refund_Section SHALL display refunded items in a structured Item_Table format
5. THE Refund_Section SHALL include refund-specific information such as refund amount and refund reason
6. WHEN no refunded items exist, THE Refund_Section SHALL NOT be displayed

### Requirement 3: Visual Differentiation Between Sections

**User Story:** As a user viewing an invoice, I want service and refund sections to be visually distinct, so that I can immediately understand which items are active and which are refunded.

#### Acceptance Criteria

1. THE Service_Section SHALL use distinct visual styling (colors, borders, icons) to indicate active items
2. THE Refund_Section SHALL use distinct visual styling (colors, borders, icons) to indicate refunded items
3. THE Service_Section and Refund_Section SHALL use different color schemes to enhance visual separation
4. THE Service_Section SHALL include appropriate icons or visual indicators for active services
5. THE Refund_Section SHALL include appropriate icons or visual indicators for refunded items

### Requirement 4: Section Ordering and Layout

**User Story:** As a user viewing an invoice, I want the sections to be logically ordered and well-spaced, so that I can easily navigate through the invoice information.

#### Acceptance Criteria

1. THE Invoice_System SHALL display the Service_Section before the Refund_Section in the layout
2. THE sections SHALL be properly spaced with adequate margins and padding
3. WHEN both sections exist, THE sections SHALL be clearly separated with visual spacing
4. THE sections SHALL maintain consistent alignment and formatting within the Invoice_Detail_View
5. THE sections SHALL be responsive and display appropriately on different screen sizes

### Requirement 5: Item Information Preservation

**User Story:** As a user viewing separated sections, I want all existing item information to be preserved and displayed, so that no important details are lost in the new layout.

#### Acceptance Criteria

1. THE Service_Section SHALL display all existing service item information (name, quantity, price, etc.)
2. THE Refund_Section SHALL display all existing refund item information including refund-specific details
3. THE item information SHALL maintain the same level of detail as the current combined display
4. THE sections SHALL preserve all existing functionality for item interaction and display
5. THE sections SHALL maintain compatibility with existing data structures and APIs

### Requirement 6: Section Subtotals and Summaries

**User Story:** As a user viewing separated sections, I want each section to show relevant subtotals, so that I can understand the financial impact of services versus refunds.

#### Acceptance Criteria

1. THE Service_Section SHALL display a subtotal for all active service items
2. THE Refund_Section SHALL display a total refund amount for all refunded items
3. THE subtotals SHALL be clearly labeled and positioned at the bottom of each respective section
4. THE subtotals SHALL use appropriate formatting and styling consistent with the section theme
5. THE subtotals SHALL be calculated accurately based on the items displayed in each section

### Requirement 7: Empty State Handling

**User Story:** As a user viewing an invoice, I want appropriate messages when sections are empty, so that I understand the current state of services and refunds.

#### Acceptance Criteria

1. WHEN no service items exist, THE Service_Section SHALL display a user-friendly empty state message
2. WHEN no refunded items exist, THE Refund_Section SHALL be hidden or not displayed
3. THE empty state messages SHALL be informative and contextually appropriate
4. THE empty states SHALL maintain consistent styling with the overall invoice design
5. WHEN an invoice has neither services nor refunds, THE Invoice_System SHALL display an appropriate overall empty state

### Requirement 8: Mobile and Responsive Display

**User Story:** As a user viewing invoices on mobile devices, I want the separated sections to display properly, so that I can access invoice information on any device.

#### Acceptance Criteria

1. THE Service_Section and Refund_Section SHALL display appropriately on mobile devices
2. THE sections SHALL maintain readability and usability on smaller screens
3. THE Item_Table format SHALL adapt to mobile screen constraints while preserving essential information
4. THE visual differentiation between sections SHALL remain clear on mobile devices
5. THE sections SHALL support touch interactions and mobile navigation patterns