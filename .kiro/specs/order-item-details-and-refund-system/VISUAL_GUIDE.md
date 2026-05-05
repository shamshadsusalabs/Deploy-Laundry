# Visual Guide - Frontend Implementation

## 🎨 What Was Built

### 1. Create Order Page - Enhanced Cart

**Location:** `/orders/new`

```
┌─────────────────────────────────────────────────────┐
│ Order Summary                                       │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐   │
│ │ Wash & Fold Service                         │   │
│ │ $5/kg                                       │   │
│ │ ┌─────────────┐  ┌─────────────┐          │   │
│ │ │ Item Type   │  │ Item Name   │          │   │
│ │ │ 👕 Clothing │  │ Shirt       │          │   │
│ │ └─────────────┘  └─────────────┘          │   │
│ │ [-] 2 [+]                          $10    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ ✓ Apply credit balance: $50                │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Subtotal:                              $10         │
│ Tax (5%):                             +$0.50       │
│ Total:                                $10.50       │
│                                                     │
│ [Create Order]                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Item type dropdown (Clothing, Linen, Accessories, Special Items)
- Item name input field
- Credit balance checkbox (appears when customer has credit)
- Quantity controls
- Real-time total calculation

---

### 2. Order Detail Page - Service Time & Refunds

**Location:** `/orders/:id`

```
┌─────────────────────────────────────────────────────┐
│ ORD-0001                          [Delivered]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Service Time                                │   │
│ │ Started: 2026-05-01 10:00 AM               │   │
│ │ Completed: 2026-05-01 2:00 PM              │   │
│ │ Duration: 4.00 hours                       │   │
│ │ ⚠️ Delayed Order                           │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Refund Information          [REFUNDED]     │   │
│ │ Total Refunded: $10.00                     │   │
│ │ [View Refund Details]                      │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Order Items                                 │   │
│ │ ┌─────────────────────────────────────┐    │   │
│ │ │ Shirt                               │    │   │
│ │ │ Wash & Fold • 👕 Clothing          │    │   │
│ │ │ Refunded $5.00                     │    │   │
│ │ │ 2 kg × $5 = $10                    │    │   │
│ │ └─────────────────────────────────────┘    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [Process Refund]                                   │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Service time tracking with start/end times
- Duration display (minutes or hours)
- Delayed order badge
- Refund information panel
- Item type badges
- Refund status per item
- Process refund button

---

### 3. Process Refund Page

**Location:** `/orders/:id/refund`

```
┌─────────────────────────────────────────────────────┐
│ Process Refund - ORD-0001                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Order Summary                               │   │
│ │ Customer: John Doe                          │   │
│ │ Total Amount: $100.00                       │   │
│ │ Status: delivered                           │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Refund Type                                 │   │
│ │ ┌──────────────┐  ┌──────────────┐        │   │
│ │ │ 💰           │  │ 📦           │        │   │
│ │ │ Full Refund  │  │ Partial      │        │   │
│ │ │ [SELECTED]   │  │ Refund       │        │   │
│ │ └──────────────┘  └──────────────┘        │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Full Order Refund                           │   │
│ │                                             │   │
│ │ Refund Amount: [100.00]                    │   │
│ │ Maximum: $100.00                           │   │
│ │                                             │   │
│ │ Refund Reason: [⏰ Delayed Service ▼]      │   │
│ │                                             │   │
│ │ [Process Full Refund ($100.00)]            │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Order summary display
- Refund type selection (Full/Partial)
- Full refund form with amount and reason
- Partial refund form with item selection
- Reason dropdown with emoji icons
- Conditional description field
- Real-time validation
- Success/error handling

---

### 4. Refund Analytics Dashboard

**Location:** `/refunds/analytics`

```
┌─────────────────────────────────────────────────────┐
│ Refund Analytics                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Filter by Date Range                        │   │
│ │ Start Date: [2026-01-01]                   │   │
│ │ End Date:   [2026-05-02]                   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│ │ 📊       │  │ 💰       │  │ 📈       │         │
│ │ Total    │  │ Total    │  │ Refund   │         │
│ │ Refunds  │  │ Amount   │  │ Rate     │         │
│ │ 25       │  │ $1,250   │  │ 5.25%    │         │
│ └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Refunds by Reason                           │   │
│ │ Delayed Service    ████████████ $500       │   │
│ │ Damaged           ████████ $300            │   │
│ │ Quality Issue     █████ $200               │   │
│ │ Lost              ███ $150                 │   │
│ │ Customer Complaint ██ $100                 │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Top Refunded Items                          │   │
│ │ #1 Shirt              $250 (10 times)      │   │
│ │ #2 Towel              $200 (8 times)       │   │
│ │ #3 Pants              $150 (6 times)       │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Date range filters
- Summary cards with icons
- Refunds by reason chart with progress bars
- Refunds by item type grid
- Top refunded items ranking
- Real-time data updates
- Responsive layout

---

## 🎨 Design Elements

### Color Scheme
- **Primary:** Cyan/Blue gradients (`from-cyan-500 to-blue-600`)
- **Success:** Emerald (`emerald-400`, `emerald-600`)
- **Warning:** Amber/Yellow (`amber-500`, `amber-600`)
- **Danger:** Red (`red-500`, `red-600`)
- **Neutral:** Slate (`slate-100` to `slate-900`)

### Typography
- **Headings:** Bold, 2xl to base sizes
- **Body:** Regular, sm to base sizes
- **Labels:** Medium, xs to sm sizes

### Spacing
- **Padding:** 3-6 units (12px-24px)
- **Gaps:** 2-4 units (8px-16px)
- **Borders:** 1-2px with rounded corners (xl, 2xl)

### Icons
- **Hero Icons:** Outline style
- **Emoji:** For visual context (👕, 🛏️, 👜, ⭐, 💰, 📦, etc.)

---

## 📱 Responsive Design

### Mobile (< 640px)
- Single column layout
- Stacked cards
- Full-width buttons
- Collapsible sections

### Tablet (640px - 1024px)
- Two column grid
- Side-by-side cards
- Responsive tables

### Desktop (> 1024px)
- Three column grid
- Sidebar navigation
- Full-width tables
- Optimal spacing

---

## ✨ Animations

### Transitions
- `transition-all duration-200` - Smooth hover effects
- `transition-colors` - Color changes
- `animate-fadeIn` - Page load animations
- `animate-spin` - Loading spinners

### Hover States
- Border color changes
- Background color changes
- Shadow effects
- Scale transforms

---

## 🔐 Access Control

### Admin & Manager Only
- Process Refund page
- Refund Analytics page
- Refund menu item in sidebar

### All Roles
- View order details
- View service time tracking
- View refund information (read-only)

---

## 🎯 User Flow

```
1. Create Order
   ↓
   Select items → Choose item type → Enter item name
   ↓
   Apply credit balance (optional)
   ↓
   Submit order

2. View Order
   ↓
   See service time tracking
   ↓
   Check for delays
   ↓
   View refund status (if applicable)

3. Process Refund (Admin/Manager)
   ↓
   Click "Process Refund"
   ↓
   Choose Full or Partial
   ↓
   Enter refund details
   ↓
   Submit refund

4. View Analytics (Admin/Manager)
   ↓
   Navigate to "Refund Analytics"
   ↓
   Apply date filters
   ↓
   Review metrics and charts
```

---

## 📊 Data Display

### Order Items Table
```
┌──────────────────────────────────────────────────┐
│ Service / Item    │ Qty  │ Rate  │ Subtotal    │
├──────────────────────────────────────────────────┤
│ Shirt             │ 2 kg │ $5    │ $10         │
│ Wash & Fold       │      │       │             │
│ 👕 Clothing       │      │       │             │
│ Refunded $5.00    │      │       │             │
└──────────────────────────────────────────────────┘
```

### Service Time Display
```
┌──────────────────────────────────────────────────┐
│ Started:    2026-05-01 10:00 AM                 │
│ Completed:  2026-05-01 2:00 PM                  │
│ Duration:   4.00 hours                          │
│ ⚠️ Delayed Order                                │
└──────────────────────────────────────────────────┘
```

### Refund Summary
```
┌──────────────────────────────────────────────────┐
│ Total Refunded: $10.00                          │
│ [View Refund Details]                           │
└──────────────────────────────────────────────────┘
```

---

## 🎉 Summary

The frontend implementation provides a complete, intuitive, and visually appealing interface for managing order item details, tracking service times, and processing refunds. All components follow the existing design system and provide a seamless user experience.
