# Implementation Plan: Order Item Details and Refund System

## Overview

This implementation plan breaks down the Order Item Details and Refund System feature into discrete, incremental coding tasks. The feature adds three major capabilities to the Laundry Management System:

1. **Item Type Categorization and Detailed Tracking**: Extends order items with item types (Clothing, Linen, Accessories, Special_Items) and detailed item names
2. **Service Time Tracking**: Automatically tracks service start/end times and calculates duration based on order status changes
3. **Comprehensive Refund System**: Supports full order refunds and partial item-level refunds with reason documentation, authorization, and invoice integration

The implementation follows the existing Node.js + Express + MongoDB architecture and integrates seamlessly with existing Order, Invoice, and Payment modules.

## Tasks

- [x] 1. Extend Order and Order Item schemas with new fields
  - [x] 1.1 Add item type and item name fields to Order Item schema
    - Extend `server/models/Order.js` orderItemSchema with `itemType` (enum: Clothing, Linen, Accessories, Special_Items), `itemName` (required string)
    - Add refund tracking fields: `isRefunded` (boolean), `refundAmount` (number), `refundReason` (enum), `refundReasonDescription` (string)
    - Ensure backward compatibility by keeping existing fields (service, serviceName, serviceType)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 5.7_

  - [ ]* 1.2 Write property tests for item type validation
    - **Property 1: Item Type Enum Validation**
    - **Property 2: Item Type Required Validation**
    - **Property 3: Item Details Round-Trip Preservation**
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.1**

  - [x] 1.3 Add service time tracking fields to Order schema
    - Extend `server/models/Order.js` orderSchema with `serviceStartTime` (Date), `serviceEndTime` (Date), `serviceDuration` (Number in hours), `isDelayed` (Boolean)
    - Add refund tracking fields: `totalRefundAmount` (Number), `hasRefund` (Boolean)
    - _Requirements: 3.1, 3.2, 3.3, 4.3, 5.4_

  - [ ]* 1.4 Write property tests for service time fields
    - **Property 9: Service Start Time Recording**
    - **Property 10: Service End Time Recording**
    - **Property 11: Service Duration Calculation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 2. Create Refund model and counter schema
  - [x] 2.1 Create Refund model with complete schema
    - Create `server/models/Refund.js` with refundSchema including: refundId (auto-generated), order/invoice/customer references, refundType (full/partial), totalRefundAmount, refundedItems array, fullOrderReason, processedBy, ipAddress, status, timestamps
    - Implement RefundCounter schema for auto-generating refund IDs (REF-0001, REF-0002, etc.)
    - Add pre-save hook to auto-generate refundId
    - _Requirements: 4.3, 5.4, 7.3_

  - [ ]* 2.2 Write property tests for refund model
    - **Property 13: Full Refund Record Creation**
    - **Property 20: Partial Refund Record Creation**
    - **Property 24: Refund Reason Preservation**
    - **Property 27: Refund Audit Fields Recording**
    - **Validates: Requirements 4.3, 5.4, 5.5, 6.3, 7.3**

- [x] 3. Extend Invoice schema with refund tracking
  - [x] 3.1 Add refund fields to Invoice model
    - Extend `server/models/Invoice.js` with `refundLineItems` array (refund reference, description, amount, refundDate), `totalRefundAmount` (Number), `creditBalance` (Number)
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ]* 3.2 Write property tests for invoice refund integration
    - **Property 14: Invoice Update on Refund**
    - **Property 15: Invoice Balance Recalculation**
    - **Property 32: Invoice Refund Line Item Structure**
    - **Property 33: Invoice Total Recalculation**
    - **Validates: Requirements 4.4, 4.5, 5.6, 5.8, 9.1, 9.2, 9.3, 9.4**

- [x] 4. Extend Settings schema with service duration thresholds
  - [x] 4.1 Add service duration threshold configuration to Settings
    - Extend `server/models/Settings.js` with `serviceDurationThresholds` (Map of serviceType to hours), `refundRecommendationEnabled` (Boolean with default true)
    - Set default thresholds: Wash & Fold: 24h, Dry Cleaning: 48h, Ironing: 12h, Wash & Iron: 24h
    - _Requirements: 10.1, 10.2_

- [x] 5. Implement Service Timer Service utility
  - [x] 5.1 Create ServiceTimerService class
    - Create `server/utils/serviceTimerService.js` with methods: `calculateDuration(startTime, endTime)`, `formatDuration(durationHours)`, `updateServiceTime(order, newStatus)`
    - Implement duration calculation in hours with 2 decimal precision
    - Implement duration formatting (minutes for <1 hour, "In Progress" for null, hours with 2 decimals for >=1 hour)
    - _Requirements: 3.3, 3.4, 3.6, 3.7_

  - [ ]* 5.2 Write unit tests for ServiceTimerService
    - Test duration calculation with various time intervals
    - Test duration formatting for edge cases (null, <1 hour, >=1 hour)
    - Test updateServiceTime for status transitions
    - _Requirements: 3.3, 3.4, 3.6, 3.7_

- [x] 6. Implement Refund Validator Service
  - [x] 6.1 Create RefundValidatorService class
    - Create `server/utils/refundValidatorService.js` with methods: `validateFullRefund(order, refundAmount)`, `validatePartialRefund(order, refundItems)`, `requiresAdminApproval(order)`
    - Implement validation rules: order status check, refund amount limits, item existence, duplicate refund prevention, payment validation, 30-day admin approval requirement
    - Return validation result object with `{ valid: Boolean, errors: Array }`
    - _Requirements: 4.2, 5.2, 5.3, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 6.2 Write property tests for refund validation
    - **Property 12: Refund Amount Limit Validation**
    - **Property 18: Partial Refund Item Validation**
    - **Property 19: Item Refund Amount Limit**
    - **Property 38: Cancelled Order Refund Prevention**
    - **Property 39: Fully Refunded Item Prevention**
    - **Property 40: Unpaid Order Refund Prevention**
    - **Validates: Requirements 4.2, 5.2, 5.3, 11.1, 11.2, 11.3, 11.5**

  - [ ]* 6.3 Write unit tests for admin approval logic
    - Test requiresAdminApproval for orders delivered >30 days ago
    - Test requiresAdminApproval for recent orders
    - _Requirements: 11.4_

- [x] 7. Implement Refund Recommender Service
  - [x] 7.1 Create RefundRecommenderService class
    - Create `server/utils/refundRecommenderService.js` with methods: `generateRecommendation(order, settings)`, `getPendingRecommendations()`
    - Implement delay detection logic (>50% over threshold)
    - Implement refund amount calculation (10% for 50-100% delay, 20% for >100% delay)
    - Return recommendation object with orderId, serviceDuration, expectedDuration, delayPercentage, recommendedAmount, refundPercentage, reason
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

  - [ ]* 7.2 Write property tests for refund recommendations
    - **Property 36: Delayed Order Flagging**
    - **Property 37: Refund Recommendation Amount Calculation**
    - **Validates: Requirements 10.2, 10.4**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update Order Controller with service time tracking
  - [x] 9.1 Modify updateOrderStatus to track service times
    - Update `server/controllers/orderController.js` updateOrderStatus function to call ServiceTimerService.updateServiceTime when status changes
    - Record serviceStartTime when status changes to "washing"
    - Record serviceEndTime and calculate serviceDuration when status changes to "delivered"
    - Check for delays and set isDelayed flag using RefundRecommenderService
    - _Requirements: 3.1, 3.2, 3.3, 10.2_

  - [ ]* 9.2 Write integration tests for status updates with timing
    - Test serviceStartTime recording on "washing" status
    - Test serviceEndTime and serviceDuration calculation on "delivered" status
    - Test isDelayed flag setting for delayed orders
    - _Requirements: 3.1, 3.2, 3.3, 10.2_

- [x] 10. Update Order Controller to support item type and item name
  - [x] 10.1 Modify createOrder to accept and validate item type and item name
    - Update `server/controllers/orderController.js` createOrder function to accept itemType and itemName in request body for each item
    - Validate itemType against enum values
    - Validate itemName is not empty
    - Calculate item subtotals and order subtotal
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 10.2 Write property tests for order item calculations
    - **Property 5: Item Subtotal Calculation**
    - **Property 6: Quantity Positive Validation**
    - **Property 7: Price Non-Negative Validation**
    - **Property 8: Order Subtotal Aggregation**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [x] 10.3 Modify getOrder to include item grouping by type
    - Update `server/controllers/orderController.js` getOrder function to group items by itemType in response
    - Add helper function to group items by type
    - _Requirements: 1.5_

  - [ ]* 10.4 Write property test for item grouping
    - **Property 4: Item Grouping by Type**
    - **Validates: Requirements 1.5**

- [x] 11. Create Refund Controller with full refund processing
  - [x] 11.1 Create RefundController with processFullRefund function
    - Create `server/controllers/refundController.js` with processFullRefund function
    - Accept orderId, reason, reasonDescription, refundAmount, notes in request body
    - Validate refund request using RefundValidatorService
    - Create refund record with refundType="full"
    - Update order with totalRefundAmount and hasRefund flag
    - Update invoice with refund line item and recalculated balances
    - Update invoice paymentStatus based on refund amount
    - Add refund entry to order statusHistory
    - Use MongoDB transactions for atomicity
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 11.2 Write integration tests for full refund processing
    - Test successful full refund with invoice update
    - Test refund rejection for cancelled orders
    - Test refund rejection for excessive amounts
    - Test refund rejection for unpaid orders
    - Test payment status update to "refunded"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 11.1, 11.2, 11.5_

- [x] 12. Implement partial refund processing in Refund Controller
  - [x] 12.1 Add processPartialRefund function to RefundController
    - Add processPartialRefund function to `server/controllers/refundController.js`
    - Accept orderId, items array (itemId, refundAmount, reason, reasonDescription), notes in request body
    - Validate refund request using RefundValidatorService
    - Create refund record with refundType="partial" and refundedItems array
    - Update each refunded item with isRefunded, refundAmount, refundReason
    - Update order with totalRefundAmount and hasRefund flag
    - Update invoice with refund line items and recalculated balances
    - Add refund entry to order statusHistory
    - Use MongoDB transactions for atomicity
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 12.2 Write property tests for partial refund processing
    - **Property 21: Refunded Item Marking**
    - **Property 25: Multiple Reasons in Partial Refund**
    - **Validates: Requirements 5.7, 6.4**

  - [ ]* 12.3 Write integration tests for partial refund processing
    - Test successful partial refund with multiple items
    - Test refund rejection for non-existent items
    - Test refund rejection for excessive item amounts
    - Test refund rejection for already fully refunded items
    - Test different refund reasons for different items
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 11.3_

- [x] 13. Implement refund reason validation
  - [x] 13.1 Add refund reason validation to RefundController
    - Add validation for refundReason enum values in both processFullRefund and processPartialRefund
    - Require refundReasonDescription when reason is "Other"
    - Return validation error if reason is missing or invalid
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 13.2 Write property tests for refund reason validation
    - **Property 22: Refund Reason Enum Validation**
    - **Property 23: Other Reason Description Required**
    - **Property 26: Refund Reason Required Validation**
    - **Validates: Requirements 6.1, 6.2, 6.5**

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement refund listing and retrieval endpoints
  - [x] 15.1 Add getRefunds function to RefundController
    - Add getRefunds function with pagination and filtering support
    - Support filters: startDate, endDate, reason, itemType, customerId, processedBy
    - Populate order, invoice, customer, and user references
    - _Requirements: 8.3_

  - [ ]* 15.2 Write property test for refund report filtering
    - **Property 30: Refund Report Filtering**
    - **Validates: Requirements 8.3**

  - [x] 15.3 Add getRefundById and getRefundsByOrder functions
    - Add getRefundById to retrieve single refund with populated references
    - Add getRefundsByOrder to retrieve all refunds for a specific order
    - _Requirements: 7.5, 12.1_

- [ ] 16. Implement refund analytics and reporting
  - [x] 16.1 Add getRefundAnalytics function to RefundController
    - Add getRefundAnalytics function to calculate: total refunds by date range, refund amount by reason, refund amount by itemType, refund rate percentage, top refunded items by frequency and amount
    - Implement refund rate calculation: (total refunded amount / total order amount) × 100
    - Support date range filtering
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ]* 16.2 Write property tests for refund analytics
    - **Property 29: Refund Rate Calculation**
    - **Property 31: Top Refunded Items Calculation**
    - **Validates: Requirements 8.2, 8.4**

  - [ ] 16.3 Add export functionality for refund reports
    - Add exportRefundReport function to generate CSV and PDF exports
    - Include all refund data with filters applied
    - _Requirements: 8.5_

- [ ] 17. Implement refund receipt generation
  - [ ] 17.1 Add generateRefundReceipt function to RefundController
    - Add generateRefundReceipt function to generate PDF receipt
    - Include: refundId, orderId, customer details, refunded items or full order indicator, totalRefundAmount, refundReason, processedBy user name, refund date
    - Use existing PDF generation library (if available) or integrate new one
    - _Requirements: 7.5_

  - [ ]* 17.2 Write property test for refund receipt generation
    - **Property 28: Refund Receipt Generation**
    - **Validates: Requirements 7.5**

- [ ] 18. Implement refund recommendations endpoint
  - [x] 18.1 Add getRefundRecommendations function to RefundController
    - Add getRefundRecommendations function to call RefundRecommenderService.getPendingRecommendations()
    - Return array of orders with refund recommendations
    - Restrict access to admin and manager roles
    - _Requirements: 10.3, 10.5_

  - [ ] 18.2 Add acceptRefundRecommendation function
    - Add acceptRefundRecommendation function to pre-fill refund form with recommended amount and reason "Delayed_Service"
    - Redirect to refund processing with pre-filled data
    - _Requirements: 10.5, 10.6_

- [x] 19. Create Refund API routes
  - [x] 19.1 Create refund routes file
    - Create `server/routes/refunds.js` with routes: POST /api/refunds/full, POST /api/refunds/partial, GET /api/refunds, GET /api/refunds/:id, GET /api/refunds/order/:orderId, GET /api/refunds/reports/analytics, POST /api/refunds/:id/receipt, GET /api/refunds/recommendations
    - Apply authentication middleware (protect) to all routes
    - Apply authorization middleware (authorize('admin', 'manager')) to refund processing routes
    - _Requirements: 7.1, 7.2_

  - [ ]* 19.2 Write integration tests for refund authorization
    - Test refund rejection from unauthorized roles (cashier)
    - Test refund acceptance from authorized roles (admin, manager)
    - _Requirements: 7.1, 7.2_

  - [x] 19.3 Register refund routes in server.js
    - Import and register refund routes in `server/server.js`
    - _Requirements: 7.1, 7.2_

- [ ] 20. Update Invoice Controller to display refund information
  - [ ] 20.1 Modify getInvoice to include refund line items
    - Update `server/controllers/invoiceController.js` getInvoice function to populate refundLineItems
    - Display refund line items with description, negative amount, and refund date
    - Display totalRefundAmount and creditBalance
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ]* 20.2 Write property tests for invoice display logic
    - **Property 16: Payment Status Update on Full Refund**
    - **Property 34: Credit Balance Display**
    - **Property 35: Payment Status Update Rules**
    - **Validates: Requirements 4.6, 9.5, 9.6**

- [x] 21. Implement customer credit balance tracking
  - [x] 21.1 Add creditBalance field to Customer model
    - Extend `server/models/Customer.js` with creditBalance field (Number, default 0)
    - _Requirements: 12.4_

  - [x] 21.2 Update RefundController to update customer credit balance
    - Modify processFullRefund and processPartialRefund to update customer creditBalance when invoice balance becomes negative
    - Calculate credit balance as absolute value of negative invoice balance
    - _Requirements: 12.4_

  - [x] 21.3 Add credit balance application to order creation
    - Modify createOrder in OrderController to allow applying customer credit balance to new orders
    - Deduct applied credit from customer creditBalance
    - Adjust order totalAmount and invoice paidAmount accordingly
    - _Requirements: 12.5_

  - [ ]* 21.4 Write property test for credit balance application
    - **Property 41: Credit Balance Application**
    - **Validates: Requirements 12.5**

- [x] 22. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Add refund notification functionality
  - [ ] 23.1 Implement refund notification sending
    - Update RefundController to send refund confirmation notification to customer via email or SMS after successful refund processing
    - Use existing notification service/controller
    - Include refund details in notification
    - _Requirements: 7.6_

  - [ ]* 23.2 Write integration tests for refund notifications
    - Test notification sending on successful refund
    - Test graceful degradation if notification fails (refund still processes)
    - _Requirements: 7.6_

- [ ] 24. Implement error handling and validation
  - [ ] 24.1 Add comprehensive error handling to RefundController
    - Implement error response format: { success: false, error: { code, message, details, field } }
    - Handle validation errors (400 Bad Request)
    - Handle not found errors (404 Not Found)
    - Handle authorization errors (403 Forbidden)
    - Handle business rule violations (400 Bad Request)
    - Handle database errors (500 Internal Server Error, 503 Service Unavailable)
    - Implement transaction rollback on errors
    - _Requirements: All error scenarios from design document_

  - [ ]* 24.2 Write integration tests for error scenarios
    - Test all validation error cases
    - Test authorization errors
    - Test business rule violations
    - Test transaction rollback on failure
    - _Requirements: All error scenarios from design document_

- [x] 25. Update frontend to display item types and item names
  - [x] 25.1 Update order creation form to include item type and item name fields
    - Modify order creation form in React Native app and web dashboard to include itemType dropdown and itemName text input for each order item
    - Add validation for required fields
    - _Requirements: 1.2, 1.3, 2.1_

  - [x] 25.2 Update order detail view to display item types and names
    - Modify order detail view to display itemType and itemName for each item
    - Group items by itemType in display
    - _Requirements: 1.4, 1.5_

- [x] 26. Update frontend to display service time tracking
  - [x] 26.1 Update order detail view to display service times
    - Modify order detail view to display serviceStartTime, serviceEndTime, and serviceDuration
    - Format serviceDuration using appropriate display format (minutes or hours)
    - Display "In Progress" when service has not completed
    - _Requirements: 3.5, 3.6, 3.7_

  - [x] 26.2 Add delayed order indicator
    - Display "Delayed" badge on orders where isDelayed is true
    - Show refund recommendation notification for managers/admins
    - _Requirements: 10.2, 10.3_

- [x] 27. Create refund processing UI
  - [x] 27.1 Create full refund form component
    - Create full refund form with fields: refundAmount, reason dropdown, reasonDescription (conditional), notes
    - Add validation for required fields and amount limits
    - Display order details and current refund status
    - Restrict access to admin and manager roles
    - _Requirements: 4.1, 6.1, 6.2, 7.1, 7.2_

  - [x] 27.2 Create partial refund form component
    - Create partial refund form with item selection, individual refund amounts, reason per item, reasonDescription (conditional), notes
    - Add validation for item existence and amount limits
    - Display item details and current refund status per item
    - Restrict access to admin and manager roles
    - _Requirements: 5.1, 6.1, 6.2, 6.4, 7.1, 7.2_

  - [x] 27.3 Integrate refund forms with API endpoints
    - Connect forms to POST /api/refunds/full and POST /api/refunds/partial endpoints
    - Handle success and error responses
    - Display success message and updated order/invoice details on success
    - Display validation errors inline
    - _Requirements: 4.1, 5.1_

- [x] 28. Create refund viewing UI
  - [x] 28.1 Add refund information to order detail view
    - Display refund badge on orders with hasRefund=true
    - Show refund details: refund type, totalRefundAmount, refundReason, refund date, refunded items (if partial)
    - Link to full refund details view
    - _Requirements: 12.1, 12.3_

  - [ ] 28.2 Add refund information to invoice view
    - Display refund line items in invoice with description, amount, and date
    - Display totalRefundAmount and creditBalance
    - Show "Credit Balance" label for negative balances
    - _Requirements: 9.1, 9.2, 9.5, 12.2_

  - [ ] 28.3 Display customer credit balance
    - Show customer creditBalance on customer profile view
    - Allow applying credit balance during order creation
    - _Requirements: 12.4, 12.5_

- [x] 29. Create refund reports and analytics UI
  - [x] 29.1 Create refund analytics dashboard
    - Create dashboard displaying: total refunds by date range, refund amount by reason (chart), refund amount by itemType (chart), refund rate percentage, top refunded items by frequency and amount
    - Add date range filter
    - Restrict access to admin and manager roles
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ] 29.2 Create refund list view with filters
    - Create refund list view with filters: date range, reason, itemType, customer, processedBy
    - Display refund summary information in list
    - Link to detailed refund view
    - Add export buttons for CSV and PDF
    - _Requirements: 8.3, 8.5_

  - [ ] 29.3 Create refund recommendations view
    - Create view displaying pending refund recommendations
    - Show order details, delay information, recommended amount
    - Add "Accept Recommendation" button to pre-fill refund form
    - Restrict access to admin and manager roles
    - _Requirements: 10.3, 10.5, 10.6_

- [ ] 30. Final checkpoint - Ensure all tests pass and integration is complete
  - Run full test suite (property tests, unit tests, integration tests)
  - Verify all API endpoints are functional
  - Verify all UI components are integrated and working
  - Test end-to-end workflows: order creation with item details, service time tracking, full refund, partial refund, refund reports, credit balance application
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at reasonable breaks
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate API endpoints and system interactions
- The implementation uses MongoDB transactions to ensure atomicity of refund operations
- Currency handling is already implemented via Settings module and is not included in these tasks
- All code follows existing Node.js + Express + MongoDB patterns in the codebase
