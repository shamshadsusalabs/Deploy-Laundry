# Requirements Document

## Introduction

This document specifies the requirements for adding Manual Items functionality to the mobile APK (React Native) for the laundry management system. The mobile APK currently supports only service selection for orders, but lacks the ability to add manual items (bedsheet, towel, shirt, cover, etc.) for damage tracking purposes. This feature exists in the website version and must be replicated in the mobile APK to achieve feature parity. Manual items are tracked for damage reference and are NOT billed to customers (serviceType: 'manual').

## Glossary

- **Mobile_APK**: The React Native mobile application deployed to Android and iOS platforms
- **Manual_Item**: A non-billable item (bedsheet, towel, shirt, cover, etc.) added to an order for damage tracking purposes only
- **Service_Item**: A billable laundry service (wash-fold, dry-cleaning, ironing, etc.) added to an order
- **Cart**: The collection of Service_Items and Manual_Items selected by the user before order placement
- **Cart_Modal**: The modal dialog that displays the Cart contents and allows order confirmation
- **CreateOrderScreen**: The React Native screen component where users create new orders
- **Item_Type**: The category of a Manual_Item (Clothing, Linen, Accessories, Special_Items)
- **Manual_Items_Section**: The UI section in CreateOrderScreen where users add and manage Manual_Items
- **Order_Submission**: The process of sending the Cart contents to the backend API to create an order
- **Dark_Theme**: The visual design pattern using #0f172a background color and complementary colors
- **LinearGradient**: The React Native component used for gradient button styling in the Mobile_APK

## Requirements

### Requirement 1: Manual Items Section Display

**User Story:** As a mobile app user, I want to see a dedicated section for adding manual items, so that I can track items like bedsheets and towels for damage reference.

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL display a Manual_Items_Section below the services section
2. THE Manual_Items_Section SHALL include a section header labeled "Add Items (Bedsheet, Towel, etc.)"
3. THE Manual_Items_Section SHALL include an "Add Item" button with a plus icon
4. WHEN no Manual_Items have been added, THE Manual_Items_Section SHALL display placeholder text "No items added. Click 'Add Item' to add bedsheet, towel, etc."
5. THE Manual_Items_Section SHALL use the Dark_Theme styling consistent with the existing CreateOrderScreen design

### Requirement 2: Add Manual Item

**User Story:** As a mobile app user, I want to add manual items to my order, so that I can document items received for damage tracking.

#### Acceptance Criteria

1. WHEN the user taps the "Add Item" button, THE CreateOrderScreen SHALL add a new empty Manual_Item entry to the Manual_Items_Section
2. THE CreateOrderScreen SHALL initialize each new Manual_Item with default values: itemType="Clothing", itemName="", quantity=1, pricePerUnit=0, subtotal=0
3. THE CreateOrderScreen SHALL display each Manual_Item in a card with input fields for itemType, itemName, quantity, and pricePerUnit
4. THE CreateOrderScreen SHALL display a calculated subtotal field for each Manual_Item (quantity × pricePerUnit)
5. THE CreateOrderScreen SHALL allow adding multiple Manual_Items to a single order

### Requirement 3: Manual Item Type Selection

**User Story:** As a mobile app user, I want to categorize manual items by type, so that items are properly organized for tracking.

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL provide a dropdown selector for Item_Type on each Manual_Item
2. THE Item_Type selector SHALL include exactly four options: "Clothing" (👕), "Linen" (🛏️), "Accessories" (👜), "Special_Items" (⭐)
3. THE CreateOrderScreen SHALL display the Item_Type with its corresponding emoji icon
4. WHEN the user changes the Item_Type, THE CreateOrderScreen SHALL update the Manual_Item immediately
5. THE Item_Type selector SHALL default to "Clothing" for new Manual_Items

### Requirement 4: Manual Item Name Input

**User Story:** As a mobile app user, I want to specify the name of each manual item, so that I can identify specific items like "bedsheet" or "towel".

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL provide a text input field labeled "Item Name" for each Manual_Item
2. THE text input field SHALL display placeholder text "e.g., Bedsheet, Towel, Shirt"
3. WHEN the user enters text, THE CreateOrderScreen SHALL update the itemName property of the Manual_Item
4. THE text input field SHALL accept alphanumeric characters and spaces
5. THE CreateOrderScreen SHALL allow itemName to be empty (validation occurs at submission)

### Requirement 5: Manual Item Quantity Input

**User Story:** As a mobile app user, I want to specify the quantity of each manual item, so that I can track multiple pieces of the same item.

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL provide a numeric input field labeled "Quantity" for each Manual_Item
2. THE quantity input SHALL accept only positive integers greater than or equal to 1
3. WHEN the user changes the quantity, THE CreateOrderScreen SHALL recalculate the subtotal (quantity × pricePerUnit)
4. THE quantity input SHALL default to 1 for new Manual_Items
5. THE CreateOrderScreen SHALL prevent quantity values less than 1

### Requirement 6: Manual Item Price Input

**User Story:** As a mobile app user, I want to enter a price per unit for manual items, so that I can document item values for insurance purposes.

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL provide a numeric input field labeled "Price per Item" for each Manual_Item
2. THE price input SHALL accept decimal numbers with up to 2 decimal places
3. WHEN the user changes the pricePerUnit, THE CreateOrderScreen SHALL recalculate the subtotal (quantity × pricePerUnit)
4. THE price input SHALL default to 0 for new Manual_Items
5. THE price input SHALL accept values greater than or equal to 0

### Requirement 7: Manual Item Subtotal Display

**User Story:** As a mobile app user, I want to see the calculated subtotal for each manual item, so that I can verify the total value of items.

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL display a read-only "Subtotal" field for each Manual_Item
2. THE subtotal field SHALL display the currency symbol followed by the calculated value (quantity × pricePerUnit)
3. WHEN quantity or pricePerUnit changes, THE CreateOrderScreen SHALL update the subtotal immediately
4. THE subtotal field SHALL format the value with 2 decimal places
5. THE subtotal field SHALL use a distinct background color to indicate it is read-only

### Requirement 8: Remove Manual Item

**User Story:** As a mobile app user, I want to remove manual items from my order, so that I can correct mistakes or remove unwanted items.

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL display a trash icon button on each Manual_Item card
2. WHEN the user taps the trash icon, THE CreateOrderScreen SHALL remove the Manual_Item from the list
3. THE CreateOrderScreen SHALL update the Manual_Items_Section immediately after removal
4. WHEN the last Manual_Item is removed, THE CreateOrderScreen SHALL display the placeholder text
5. THE trash icon button SHALL use red color (#ef4444) to indicate destructive action

### Requirement 9: Manual Items in Cart Display

**User Story:** As a mobile app user, I want to see manual items in the cart modal, so that I can review all items before placing an order.

#### Acceptance Criteria

1. WHEN the Cart_Modal is opened, THE CreateOrderScreen SHALL display all Manual_Items in a separate section labeled "Items"
2. THE Cart_Modal SHALL distinguish Manual_Items from Service_Items using a different visual indicator (emerald color #22c55e)
3. THE Cart_Modal SHALL display each Manual_Item with its itemType, itemName, quantity, pricePerUnit, and subtotal
4. THE Cart_Modal SHALL display a note indicating Manual_Items are "For tracking only - not billed"
5. THE Cart_Modal SHALL allow removing Manual_Items using a "Remove" button

### Requirement 10: Manual Items in Cart Count

**User Story:** As a mobile app user, I want the cart button to reflect manual items, so that I know items have been added.

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL include Manual_Items in the cart count badge
2. THE cart count badge SHALL display the sum of Service_Item quantities and Manual_Item quantities
3. WHEN Manual_Items are added or removed, THE CreateOrderScreen SHALL update the cart count immediately
4. THE floating cart button SHALL appear when at least one Service_Item or Manual_Item exists
5. THE cart count badge SHALL display a single numeric value representing total items

### Requirement 11: Order Submission with Manual Items

**User Story:** As a mobile app user, I want to submit orders containing manual items, so that items are tracked in the system.

#### Acceptance Criteria

1. WHEN the user confirms the order, THE CreateOrderScreen SHALL include all Manual_Items in the Order_Submission payload
2. THE CreateOrderScreen SHALL transform each Manual_Item to include: service=null, serviceName=itemName, serviceType="manual", itemType, itemName, quantity, unit="piece", pricePerUnit, subtotal
3. THE CreateOrderScreen SHALL combine Service_Items and Manual_Items into a single items array for Order_Submission
4. THE CreateOrderScreen SHALL send the Order_Submission to the /customer-portal/orders endpoint
5. WHEN Order_Submission succeeds, THE CreateOrderScreen SHALL clear all Manual_Items from the Cart

### Requirement 12: Manual Item Validation

**User Story:** As a mobile app user, I want to receive validation errors for incomplete manual items, so that I can correct issues before submission.

#### Acceptance Criteria

1. WHEN the user attempts Order_Submission with a Manual_Item that has an empty itemName, THE CreateOrderScreen SHALL display an error alert "Please provide item name for all manual items"
2. WHEN the user attempts Order_Submission with a Manual_Item that has quantity less than 1, THE CreateOrderScreen SHALL display an error alert "Quantity must be at least 1 for all items"
3. THE CreateOrderScreen SHALL prevent Order_Submission when validation fails
4. THE CreateOrderScreen SHALL allow Order_Submission when all Manual_Items have valid itemName and quantity values
5. THE CreateOrderScreen SHALL allow Order_Submission when no Manual_Items are present

### Requirement 13: Empty Cart Validation

**User Story:** As a mobile app user, I want to be prevented from submitting empty orders, so that I don't create invalid orders.

#### Acceptance Criteria

1. WHEN the user attempts Order_Submission with zero Service_Items and zero Manual_Items, THE CreateOrderScreen SHALL display an error alert "Please add at least one service or item"
2. THE CreateOrderScreen SHALL allow Order_Submission when only Service_Items are present
3. THE CreateOrderScreen SHALL allow Order_Submission when only Manual_Items are present
4. THE CreateOrderScreen SHALL allow Order_Submission when both Service_Items and Manual_Items are present
5. THE CreateOrderScreen SHALL disable the "Confirm Order" button when the Cart is empty

### Requirement 14: Manual Items Styling Consistency

**User Story:** As a mobile app user, I want manual items to match the app's visual design, so that the interface feels cohesive.

#### Acceptance Criteria

1. THE Manual_Items_Section SHALL use background color #1e293b for item cards
2. THE Manual_Items_Section SHALL use border color #334155 for item card borders
3. THE Manual_Items_Section SHALL use text color #f1f5f9 for primary text
4. THE Manual_Items_Section SHALL use text color #64748b for secondary text and labels
5. THE "Add Item" button SHALL use LinearGradient with colors ['#06b6d4', '#0284c7'] matching existing buttons

### Requirement 15: Cross-Platform Compatibility

**User Story:** As a mobile app user, I want manual items functionality to work on both Android and iOS, so that all users have the same experience.

#### Acceptance Criteria

1. THE Manual_Items_Section SHALL render correctly on Android devices
2. THE Manual_Items_Section SHALL render correctly on iOS devices
3. THE Manual_Items_Section SHALL use React Native components compatible with both platforms
4. THE Manual_Items_Section SHALL handle touch interactions consistently on both platforms
5. THE Manual_Items_Section SHALL display text inputs with platform-appropriate keyboards (numeric for quantity and price)

### Requirement 16: Manual Items State Management

**User Story:** As a developer, I want manual items state to be managed properly, so that the UI remains synchronized with data.

#### Acceptance Criteria

1. THE CreateOrderScreen SHALL maintain a manualItems state array containing all Manual_Items
2. WHEN a Manual_Item is added, THE CreateOrderScreen SHALL append it to the manualItems array
3. WHEN a Manual_Item is removed, THE CreateOrderScreen SHALL filter it from the manualItems array
4. WHEN a Manual_Item field is updated, THE CreateOrderScreen SHALL update the corresponding item in the manualItems array
5. WHEN Order_Submission succeeds, THE CreateOrderScreen SHALL reset manualItems to an empty array

### Requirement 17: Manual Items Not Included in Billing Total

**User Story:** As a mobile app user, I want manual items to be excluded from the billing total, so that I am only charged for services.

#### Acceptance Criteria

1. THE Cart_Modal SHALL calculate the total amount using only Service_Items
2. THE Cart_Modal SHALL exclude Manual_Item subtotals from the displayed total
3. THE Cart_Modal SHALL display a visual indicator that Manual_Items are "For tracking only - not billed"
4. THE floating cart button total SHALL display only the sum of Service_Item subtotals
5. THE CreateOrderScreen SHALL clearly distinguish billable Service_Items from non-billable Manual_Items in the UI

### Requirement 18: Manual Items Scrolling Behavior

**User Story:** As a mobile app user, I want to scroll through manual items easily, so that I can manage many items without UI issues.

#### Acceptance Criteria

1. WHEN more than 3 Manual_Items are added, THE Manual_Items_Section SHALL remain scrollable within the CreateOrderScreen
2. THE CreateOrderScreen SHALL use ScrollView to accommodate variable numbers of Manual_Items
3. THE Manual_Items_Section SHALL not cause horizontal scrolling
4. THE CreateOrderScreen SHALL maintain proper padding at the bottom to prevent content being hidden by the floating cart button
5. THE Manual_Items_Section SHALL render efficiently with up to 50 Manual_Items

### Requirement 19: Manual Items Accessibility

**User Story:** As a mobile app user with accessibility needs, I want manual items to be accessible, so that I can use the feature effectively.

#### Acceptance Criteria

1. THE Manual_Items_Section input fields SHALL have accessible labels for screen readers
2. THE "Add Item" button SHALL have an accessible label "Add manual item"
3. THE trash icon button SHALL have an accessible label "Remove manual item"
4. THE Item_Type selector SHALL announce the selected option to screen readers
5. THE Manual_Items_Section SHALL support sufficient touch target sizes (minimum 44x44 points) for all interactive elements

### Requirement 20: Manual Items Error Handling

**User Story:** As a mobile app user, I want clear error messages when manual items submission fails, so that I can resolve issues.

#### Acceptance Criteria

1. WHEN Order_Submission fails due to network error, THE CreateOrderScreen SHALL display an error alert with the message "Failed to place order. Please check your connection."
2. WHEN Order_Submission fails due to server error, THE CreateOrderScreen SHALL display the error message from the API response
3. WHEN Order_Submission fails, THE CreateOrderScreen SHALL preserve all Manual_Items in the Cart
4. WHEN Order_Submission fails, THE CreateOrderScreen SHALL re-enable the "Confirm Order" button
5. THE CreateOrderScreen SHALL log Manual_Items data to console for debugging purposes when errors occur

