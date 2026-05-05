# Implementation Plan: Mobile APK Manual Items Feature

## Overview

This implementation plan breaks down the Manual Items feature into discrete, actionable coding tasks. The feature adds the ability to track non-billable items (bedsheet, towel, shirt, cover, etc.) in the React Native mobile application for damage tracking purposes. Each task builds incrementally on previous work, with checkpoints to ensure quality and correctness.

## Tasks

- [x] 1. Set up state management for manual items
  - Add `manualItems` state variable with `ManualItem` interface
  - Implement `addManualItem()` function to append new items with defaults
  - Implement `updateManualItem()` function to update fields and recalculate subtotals
  - Implement `removeManualItem()` function to filter out items
  - Update `getCartCount()` to include manual items count
  - _Requirements: 2.1, 2.2, 16.1, 16.2, 16.3, 16.4, 10.1, 10.2_

- [ ]* 1.1 Write unit tests for state management functions
  - Test `addManualItem()` creates item with correct defaults
  - Test `updateManualItem()` updates correct field and recalculates subtotal
  - Test `removeManualItem()` removes correct item
  - Test `getCartCount()` includes manual items
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 10.1_

- [x] 2. Create Manual Items Section UI layout
  - Add Manual Items Section below services section in ScrollView
  - Create section header with title "Add Items (Bedsheet, Towel, etc.)"
  - Add "Add Item" button with LinearGradient styling and plus icon
  - Implement empty state placeholder text
  - Apply dark theme styling consistent with existing design
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 3. Implement Manual Item Card component
  - [x] 3.1 Create ManualItemCard component structure
    - Define `ManualItemCardProps` interface
    - Create card layout with dark theme styling
    - Add two-row layout for input fields
    - _Requirements: 2.3, 14.1, 14.2, 14.3, 14.4_

  - [x] 3.2 Implement Item Type selector
    - Add Picker component for itemType field
    - Include four options: Clothing (👕), Linen (🛏️), Accessories (👜), Special_Items (⭐)
    - Set default value to "Clothing"
    - Wire up `onValueChange` to call `updateManualItem()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 Implement Item Name input field
    - Add TextInput for itemName with label "Item Name"
    - Set placeholder text "e.g., Bedsheet, Towel, Shirt"
    - Wire up `onChangeText` to call `updateManualItem()`
    - Apply dark theme input styling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.4 Implement Quantity input field
    - Add TextInput for quantity with label "Quantity"
    - Set `keyboardType="numeric"` for numeric keyboard
    - Parse input as integer with minimum value of 1
    - Wire up to call `updateManualItem()` and trigger subtotal recalculation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.5 Implement Price per Unit input field
    - Add TextInput for pricePerUnit with label "Price per Item"
    - Set `keyboardType="decimal-pad"` for decimal keyboard
    - Parse input as float with minimum value of 0
    - Wire up to call `updateManualItem()` and trigger subtotal recalculation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.6 Implement Subtotal display and Remove button
    - Add read-only subtotal field displaying calculated value (quantity × pricePerUnit)
    - Format subtotal with currency symbol and 2 decimal places
    - Add trash icon button with red color (#ef4444)
    - Wire up remove button to call `removeManualItem()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Checkpoint - Test manual items UI and state management
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrate manual items into Cart Modal
  - [x] 5.1 Add Manual Items section to Cart Modal
    - Add "Items" section header in Cart Modal
    - Display "For tracking only - not billed" note in emerald color
    - Render manual items list with emerald border styling
    - Show itemType badge, itemName, quantity, pricePerUnit, and subtotal
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 17.3_

  - [x] 5.2 Implement remove functionality in Cart Modal
    - Add "Remove" button for each manual item in cart
    - Wire up to call `removeManualItem()`
    - Update cart display immediately after removal
    - _Requirements: 9.5, 8.2, 8.3_

  - [ ]* 5.3 Write integration tests for Cart Modal display
    - Test manual items appear in cart modal
    - Test manual items show emerald styling
    - Test "For tracking only" note displays
    - Test remove button removes items
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [x] 6. Implement validation logic for manual items
  - Add validation for empty itemName before order submission
  - Add validation for quantity < 1 before order submission
  - Add validation for empty cart (no services and no manual items)
  - Display appropriate Alert messages for each validation error
  - Prevent order submission when validation fails
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4_

- [ ]* 6.1 Write unit tests for validation logic
  - Test empty itemName validation
  - Test quantity < 1 validation
  - Test empty cart validation
  - Test validation passes with valid data
  - _Requirements: 12.1, 12.2, 13.1_

- [x] 7. Update order submission logic
  - [x] 7.1 Implement manual items payload transformation
    - Transform each manual item to include: service=null, serviceName=itemName, serviceType="manual", itemType, itemName, quantity, unit="piece", pricePerUnit, subtotal
    - Combine service items and manual items into single items array
    - _Requirements: 11.2, 11.3_

  - [x] 7.2 Update placeOrder() function
    - Include manual items in order submission payload
    - Send combined items array to /customer-portal/orders endpoint
    - Clear manualItems state on successful submission
    - Preserve manualItems state on error
    - Add console logging for debugging manual items data
    - _Requirements: 11.1, 11.4, 11.5, 16.5, 20.3, 20.5_

  - [x] 7.3 Implement error handling for order submission
    - Handle network errors with appropriate message
    - Handle server errors using API response message
    - Re-enable "Confirm Order" button on error
    - Preserve manual items in cart on error
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [ ]* 7.4 Write integration tests for order submission
  - Test manual items included in payload
  - Test payload transformation structure
  - Test manual items cleared on success
  - Test manual items preserved on error
  - _Requirements: 11.1, 11.2, 11.3, 16.5, 20.3_

- [x] 8. Checkpoint - Test order submission flow end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Ensure cart total excludes manual items
  - Verify `getCartTotal()` calculates total using only service items
  - Verify floating cart button displays only service items total
  - Verify Cart Modal total displays only service items total
  - Add visual distinction between billable and non-billable items
  - _Requirements: 17.1, 17.2, 17.4, 17.5_

- [x] 10. Apply styling and polish
  - Verify all colors match dark theme palette (#0f172a, #1e293b, #334155, #f1f5f9, #64748b, #94a3b8)
  - Verify LinearGradient buttons use ['#06b6d4', '#0284c7']
  - Verify emerald color (#22c55e) used for manual items indicators
  - Verify red color (#ef4444) used for remove buttons
  - Ensure consistent spacing, padding, and border radius
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 11. Test cross-platform compatibility
  - Test rendering on Android device/emulator
  - Test rendering on iOS device/simulator
  - Test Picker component on both platforms
  - Test keyboard types (numeric, decimal-pad) on both platforms
  - Test touch interactions on both platforms
  - Fix any platform-specific issues
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 12. Verify scrolling behavior
  - Test scrolling with 3+ manual items
  - Verify no horizontal scrolling occurs
  - Verify bottom padding prevents content hidden by floating cart button
  - Test performance with 10+ manual items
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 13. Add accessibility improvements
  - Add accessible labels to all input fields
  - Add accessible label "Add manual item" to Add Item button
  - Add accessible label "Remove manual item" to trash icon button
  - Verify touch target sizes are minimum 44x44 points
  - Test with screen reader (TalkBack on Android, VoiceOver on iOS)
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 14. Final checkpoint - Complete testing and validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The design document uses TypeScript/React Native, so all code will be in TypeScript
- Manual items are NOT billed to customers (serviceType: 'manual')
- Manual items are tracked for damage reference purposes only
- The existing CreateOrderScreen.tsx file will be modified incrementally
- All styling must match the existing dark theme design
- Cross-platform compatibility (Android & iOS) is critical
