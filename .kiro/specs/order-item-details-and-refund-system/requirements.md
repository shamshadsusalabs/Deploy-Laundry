# Requirements Document

## Introduction

This document specifies the requirements for enhancing the Laundry Management System with detailed item tracking, service time monitoring, and a comprehensive refund mechanism. The enhancement enables the system to capture granular item-level details (such as towels, shirts, pants) with individual pricing, track service duration for each order, and provide flexible refund capabilities when service issues occur.

## Glossary

- **Order_System**: The module responsible for creating, managing, and tracking laundry orders
- **Item**: A specific laundry article (e.g., towel, shirt, pant, bedsheet) with associated service type and pricing
- **Item_Type**: A categorization of laundry articles (e.g., Clothing, Linen, Accessories)
- **Service_Timer**: The component that tracks start time, end time, and duration for order processing
- **Refund_System**: The module responsible for processing full and partial refunds
- **Item_Refund**: A refund applied to specific items within an order
- **Order_Refund**: A refund applied to the entire order
- **Refund_Reason**: The documented justification for issuing a refund (e.g., damaged, lost, delayed)
- **Invoice_System**: The existing billing module that generates invoices and tracks payments
- **Order_Status**: The current state of an order (received, washing, packed, delivered, cancelled)
- **Service_Duration**: The calculated time difference between service start and service end
- **Refund_Amount**: The monetary value being refunded to the customer
- **Original_Amount**: The initial total amount charged for an order or item

## Requirements

### Requirement 1: Item Type Categorization

**User Story:** As a cashier, I want to categorize laundry items by type (clothing, linen, accessories), so that I can organize orders more effectively and generate accurate reports.

#### Acceptance Criteria

1. THE Order_System SHALL support the following Item_Type categories: Clothing, Linen, Accessories, Special_Items
2. WHEN creating an order item, THE Order_System SHALL require selection of an Item_Type
3. THE Order_System SHALL allow defining custom item names within each Item_Type (e.g., "Shirt", "Towel", "Bedsheet")
4. THE Order_System SHALL store Item_Type and item name for each order item
5. WHEN displaying order details, THE Order_System SHALL group items by Item_Type

### Requirement 2: Detailed Item Information Capture

**User Story:** As a cashier, I want to capture detailed information about each laundry item including its specific name and individual price, so that customers receive itemized billing and can track exactly what was serviced.

#### Acceptance Criteria

1. WHEN creating an order item, THE Order_System SHALL capture: item name, Item_Type, service type, quantity, unit (piece/kg/bundle), price per unit, and subtotal
2. THE Order_System SHALL calculate item subtotal as quantity multiplied by price per unit
3. THE Order_System SHALL validate that quantity is greater than zero
4. THE Order_System SHALL validate that price per unit is greater than or equal to zero
5. WHEN an order contains multiple items, THE Order_System SHALL calculate order subtotal as the sum of all item subtotals
6. THE Order_System SHALL preserve existing item structure (service reference, serviceName, serviceType) for backward compatibility

### Requirement 3: Service Time Tracking

**User Story:** As a manager, I want to track how long each order takes from start to completion, so that I can identify delays, optimize operations, and justify refunds when service time exceeds expectations.

#### Acceptance Criteria

1. WHEN an order status changes to "washing", THE Service_Timer SHALL record the service start timestamp
2. WHEN an order status changes to "delivered", THE Service_Timer SHALL record the service end timestamp
3. THE Service_Timer SHALL calculate Service_Duration as the difference between service end and service start timestamps
4. THE Service_Timer SHALL store Service_Duration in hours with two decimal precision
5. WHEN service has not started, THE Service_Timer SHALL display service start time as null
6. WHEN service has not completed, THE Service_Timer SHALL display service end time as null and Service_Duration as "In Progress"
7. THE Order_System SHALL display Service_Duration on order detail views

### Requirement 4: Full Order Refund Processing

**User Story:** As a manager, I want to issue full refunds for orders when major service failures occur, so that customers are compensated fairly and maintain trust in our service.

#### Acceptance Criteria

1. WHEN a full refund is requested, THE Refund_System SHALL accept: order reference, Refund_Reason, and refund amount
2. THE Refund_System SHALL validate that refund amount does not exceed Original_Amount
3. WHEN processing a full refund, THE Refund_System SHALL create a refund record with: refund type (full), Refund_Amount, Refund_Reason, refund date, and processed by user reference
4. THE Refund_System SHALL update the associated invoice to reflect the refunded amount
5. THE Refund_System SHALL recalculate invoice balance due as Original_Amount minus paid amount minus Refund_Amount
6. WHEN a full refund equals the Original_Amount, THE Refund_System SHALL update payment status to "refunded"
7. THE Refund_System SHALL record the refund in order history with timestamp and user reference

### Requirement 5: Partial Item-Level Refund Processing

**User Story:** As a manager, I want to issue refunds for specific damaged or lost items within an order, so that customers are compensated fairly without refunding the entire order.

#### Acceptance Criteria

1. WHEN a partial refund is requested, THE Refund_System SHALL accept: order reference, array of item references, Refund_Reason per item, and refund amount per item
2. THE Refund_System SHALL validate that each item reference exists within the specified order
3. THE Refund_System SHALL validate that refund amount per item does not exceed the item's subtotal
4. WHEN processing a partial refund, THE Refund_System SHALL create a refund record with: refund type (partial), array of refunded items with individual amounts, total Refund_Amount, Refund_Reason per item, refund date, and processed by user reference
5. THE Refund_System SHALL calculate total Refund_Amount as the sum of all item refund amounts
6. THE Refund_System SHALL update the associated invoice to reflect the total refunded amount
7. THE Refund_System SHALL mark refunded items with refund status and Refund_Amount in the order record
8. THE Refund_System SHALL recalculate invoice balance due as Original_Amount minus paid amount minus total Refund_Amount

### Requirement 6: Refund Reason Documentation

**User Story:** As a manager, I want to document specific reasons for each refund, so that I can analyze refund patterns and improve service quality.

#### Acceptance Criteria

1. THE Refund_System SHALL support the following Refund_Reason values: Damaged, Lost, Delayed_Service, Quality_Issue, Customer_Complaint, Other
2. WHEN Refund_Reason is "Other", THE Refund_System SHALL require a custom reason description
3. THE Refund_System SHALL store Refund_Reason with each refund record
4. WHEN processing item-level refunds, THE Refund_System SHALL allow different Refund_Reason values for different items in the same refund transaction
5. THE Refund_System SHALL validate that Refund_Reason is provided before processing any refund

### Requirement 7: Refund Authorization and Audit Trail

**User Story:** As an admin, I want to track who authorized each refund and when, so that I can maintain accountability and audit refund activities.

#### Acceptance Criteria

1. THE Refund_System SHALL require user authentication before processing any refund
2. THE Refund_System SHALL restrict refund processing to users with roles: admin, manager
3. WHEN a refund is processed, THE Refund_System SHALL record: user reference who authorized the refund, timestamp, and IP address
4. THE Refund_System SHALL add refund details to order status history
5. THE Refund_System SHALL generate a refund receipt with: refund ID, order ID, customer details, refunded items or full order indicator, Refund_Amount, Refund_Reason, authorized by user name, and refund date
6. THE Refund_System SHALL send refund confirmation notification to the customer via email or SMS

### Requirement 8: Refund Reporting and Analytics

**User Story:** As an admin, I want to view refund reports and analytics, so that I can identify trends, reduce refund rates, and improve operational efficiency.

#### Acceptance Criteria

1. THE Refund_System SHALL provide a refund report showing: total refunds by date range, refund amount by Refund_Reason, refund amount by Item_Type, and refund rate percentage
2. THE Refund_System SHALL calculate refund rate as (total refunded amount / total order amount) × 100
3. WHEN filtering refund reports, THE Refund_System SHALL support filters by: date range, Refund_Reason, Item_Type, customer, and authorized user
4. THE Refund_System SHALL display top refunded items by frequency and amount
5. THE Refund_System SHALL export refund reports in CSV and PDF formats

### Requirement 9: Invoice Integration with Refunds

**User Story:** As a cashier, I want invoices to automatically reflect refund amounts, so that customers see accurate balance due and payment history.

#### Acceptance Criteria

1. WHEN a refund is processed, THE Invoice_System SHALL add a refund line item to the invoice
2. THE Invoice_System SHALL display refund line items with: description "Refund - [Reason]", negative amount, and refund date
3. THE Invoice_System SHALL recalculate total amount as Original_Amount minus total refunds
4. THE Invoice_System SHALL recalculate balance due as total amount minus paid amount
5. WHEN balance due becomes negative after a refund, THE Invoice_System SHALL display the negative balance as "Credit Balance"
6. THE Invoice_System SHALL update payment status based on refund: "refunded" if fully refunded, "partial" if partially refunded with remaining balance, "paid" if refunded but previously overpaid

### Requirement 10: Service Time-Based Refund Recommendations

**User Story:** As a manager, I want the system to recommend refunds when service time exceeds expected duration, so that I can proactively address customer satisfaction issues.

#### Acceptance Criteria

1. THE Order_System SHALL define expected Service_Duration thresholds for each service type
2. WHEN Service_Duration exceeds the expected threshold by 50 percent, THE Order_System SHALL flag the order as "Delayed"
3. WHEN an order is flagged as "Delayed", THE Order_System SHALL display a refund recommendation notification to managers and admins
4. THE Order_System SHALL calculate recommended refund amount as 10 percent of order total for delays between 50-100 percent over threshold, and 20 percent for delays exceeding 100 percent over threshold
5. THE Order_System SHALL allow managers to accept or dismiss refund recommendations
6. WHEN a refund recommendation is accepted, THE Order_System SHALL pre-fill refund form with recommended amount and Refund_Reason "Delayed_Service"

### Requirement 11: Refund Constraints and Business Rules

**User Story:** As an admin, I want to enforce business rules on refunds, so that the system prevents fraudulent or excessive refunds.

#### Acceptance Criteria

1. THE Refund_System SHALL prevent refunds on orders with status "cancelled"
2. THE Refund_System SHALL prevent total refunds (sum of all refunds) from exceeding Original_Amount for any order
3. THE Refund_System SHALL prevent refunds on items that have already been fully refunded
4. WHEN an order has been delivered more than 30 days ago, THE Refund_System SHALL require admin approval for refund processing
5. THE Refund_System SHALL validate that at least one payment has been made before processing a refund
6. WHEN processing a refund, THE Refund_System SHALL check if customer has outstanding balance on other orders and display a warning to the user

### Requirement 12: Customer Refund Visibility

**User Story:** As a customer, I want to view refund details in my order history and invoices, so that I can track refunds and understand adjustments to my account.

#### Acceptance Criteria

1. WHEN viewing order details, THE Order_System SHALL display refund information including: refund type (full/partial), Refund_Amount, Refund_Reason, refund date, and refunded items if partial
2. WHEN viewing invoice details, THE Invoice_System SHALL display all refund line items with dates and amounts
3. THE Order_System SHALL display refund status badge on orders that have been refunded
4. WHEN a customer has a credit balance from refunds, THE Order_System SHALL display the credit balance on the customer profile
5. THE Order_System SHALL allow applying credit balance to future orders

