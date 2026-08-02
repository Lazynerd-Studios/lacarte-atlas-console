# Admin Panel Guide: Customer Type Management

This guide explains the new fields on the Customer Type create/edit form and how they connect to the pricing model.

## What Changed

Customer types now control **how customers are priced** and **what they can book**. Three new fields were added to the backend:

| New field | Purpose |
|-----------|---------|
| `pricingMode` | Determines pricing strategy: `per_bin` (capacity × bins) or `full_truck` (flat truck tier) |
| `estimatedQuantityIds` | Which quantity options this type sees on the booking/registration form |
| `disposableItemTypeIds` | Which waste item types this type can book |

If the arrays are **omitted or empty**, the type sees **all active options** (default-all rule).

---

## Updated Form Layout

### Before (current)

```
┌─────────────────────────────────────────┐
│ Add Customer Type                       │
├─────────────────────────────────────────┤
│ Name            [Commercial]            │
│                                         │
│              [Cancel]  [Save]           │
└─────────────────────────────────────────┘
```

### After (updated)

```
┌─────────────────────────────────────────┐
│ Add Customer Type                       │
├─────────────────────────────────────────┤
│ Name            [Commercial]            │
│                                         │
│ Pricing Mode    (●) Per Bin             │
│                 ( ) Full Truck          │
│                                         │
│ ┌─ Booking Menu (optional) ───────────┐ │
│ │ Estimated Quantities                │ │
│ │  ☑ Small (1-2 bags)                │ │
│ │  ☑ Medium (3-5 bags)               │ │
│ │  ☐ Large (6-10 bags)               │ │
│ │  ☐ Full Truck Load                  │ │
│ │                                     │ │
│ │ Disposable Item Types               │ │
│ │  ☑ General Waste                    │ │
│ │  ☑ Recyclables                      │ │
│ │  ☐ Organic Waste                    │ │
│ │  ☐ Construction Debris              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ℹ️ Leave unchecked = type sees ALL      │
│                                         │
│              [Cancel]  [Save]           │
└─────────────────────────────────────────┘
```

---

## Field Guide

### Pricing Mode

| Value | Label | Meaning | Affects |
|-------|-------|---------|---------|
| `per_bin` | Per Bin (default) | Price = capacity rate × customer's bin count | Bin Capacity + Assigned BINs shown on customer form |
| `full_truck` | Full Truck | Price = truck load tier chosen at booking | Bin fields hidden on customer form; truck tier dropdown shown on pickup form |

### Estimated Quantities (multi-select)

Controls which quantity options appear when a customer of this type registers or books a pickup.

- **Checked** = only those quantities are available
- **None checked** = all active quantities are available (default-all)

### Disposable Item Types (multi-select)

Controls which waste categories a customer of this type can select when booking.

- **Checked** = only those item types are available
- **None checked** = all active item types are available (default-all)

---

## Data Sources for Dropdowns

Fetch these to populate the multi-select checkboxes:

### Estimated Quantities

```http
GET /api/disposable/quantities/active
```

```json
[
  { "id": "qty-uuid-1", "label": "Small", "description": "1-2 bags", "binCount": 1 },
  { "id": "qty-uuid-2", "label": "Medium", "description": "3-5 bags", "binCount": 3 },
  { "id": "qty-uuid-3", "label": "Large", "description": "6-10 bags", "binCount": 6 },
  { "id": "qty-uuid-4", "label": "Full Truck Load", "description": "Full truck", "binCount": 200 }
]
```

### Disposable Item Types

```http
GET /api/disposable/item-types/active
```

```json
[
  { "id": "item-uuid-1", "name": "General Waste", "description": "Standard household waste", "icon": null },
  { "id": "item-uuid-2", "name": "Recyclables", "description": "Plastics, paper, glass", "icon": null },
  { "id": "item-uuid-3", "name": "Organic Waste", "description": "Food and garden waste", "icon": null },
  { "id": "item-uuid-4", "name": "Construction Debris", "description": "Building and renovation waste", "icon": null }
]
```

---

## API: Create Customer Type

```http
POST /api/customer/admin/types
Authorization: Bearer <admin-token>
Content-Type: application/json
```

Permission required: `management.customer_types`

### Request — per_bin type with specific booking menu

```json
{
  "name": "Hospitality",
  "pricingMode": "per_bin",
  "estimatedQuantityIds": ["qty-uuid-1", "qty-uuid-2"],
  "disposableItemTypeIds": ["item-uuid-1", "item-uuid-2"]
}
```

### Request — full_truck type (sees all options)

```json
{
  "name": "Construction",
  "pricingMode": "full_truck"
}
```

> Omitting the arrays means this type sees **all** active quantities and item types.

### Request — minimal (defaults to per_bin, sees everything)

```json
{
  "name": "Household"
}
```

### Field reference

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `name` | string | Yes | — | 1–100 chars, must be unique |
| `pricingMode` | `"per_bin" \| "full_truck"` | No | `"per_bin"` | How customers of this type are priced |
| `estimatedQuantityIds` | UUID[] | No | all active | Empty array = sees all; specific IDs = restricted menu |
| `disposableItemTypeIds` | UUID[] | No | all active | Empty array = sees all; specific IDs = restricted menu |

### Response `201`

```json
{
  "id": "type-uuid-new",
  "name": "Hospitality",
  "pricingMode": "per_bin",
  "customerCount": 0,
  "estimatedQuantities": [
    { "id": "qty-uuid-1", "label": "Small", "description": "1-2 bags", "binCount": 1 },
    { "id": "qty-uuid-2", "label": "Medium", "description": "3-5 bags", "binCount": 3 }
  ],
  "disposableItemTypes": [
    { "id": "item-uuid-1", "name": "General Waste", "icon": null },
    { "id": "item-uuid-2", "name": "Recyclables", "icon": null }
  ],
  "createdAt": "2026-08-01T12:00:00.000Z",
  "updatedAt": "2026-08-01T12:00:00.000Z"
}
```

---

## API: Update Customer Type

```http
PATCH /api/customer/admin/types/:id
Authorization: Bearer <admin-token>
Content-Type: application/json
```

### Request — change pricing mode only

```json
{
  "name": "Construction",
  "pricingMode": "full_truck"
}
```

### Request — replace quantity associations

```json
{
  "name": "Hospitality",
  "estimatedQuantityIds": ["qty-uuid-1", "qty-uuid-2", "qty-uuid-3"]
}
```

> Providing an array **replaces** the entire set. Omitting the field leaves it untouched. Sending `[]` detaches all (type reverts to seeing everything).

### Request — detach all disposable item types (type sees all)

```json
{
  "name": "Hospitality",
  "disposableItemTypeIds": []
}
```

### Response `200`

Same shape as the create response — returns the full updated type with resolved associations.

---

## API: List Customer Types

```http
GET /api/customer/admin/types
Authorization: Bearer <admin-token>
```

### Response `200`

```json
[
  {
    "id": "type-uuid-1",
    "name": "Hospitality",
    "pricingMode": "per_bin",
    "customerCount": 24,
    "estimatedQuantities": [
      { "id": "qty-uuid-1", "label": "Small", "description": "1-2 bags", "binCount": 1 },
      { "id": "qty-uuid-2", "label": "Medium", "description": "3-5 bags", "binCount": 3 }
    ],
    "disposableItemTypes": [
      { "id": "item-uuid-1", "name": "General Waste", "icon": null },
      { "id": "item-uuid-2", "name": "Recyclables", "icon": null }
    ],
    "createdAt": "2026-01-15T09:00:00.000Z",
    "updatedAt": "2026-06-20T14:30:00.000Z"
  },
  {
    "id": "type-uuid-2",
    "name": "Construction",
    "pricingMode": "full_truck",
    "customerCount": 8,
    "estimatedQuantities": [],
    "disposableItemTypes": [],
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-01T10:00:00.000Z"
  }
]
```

> Empty arrays in the response mean the type sees **all** active options (default-all rule). The list view should display this as "All" rather than "None".

---

## API: Get Single Customer Type

```http
GET /api/customer/admin/types/:id
Authorization: Bearer <admin-token>
```

### Response `200`

Same shape as a single item in the list response.

---

## API: Delete Customer Type

```http
DELETE /api/customer/admin/types/:id
Authorization: Bearer <admin-token>
```

### Response `204`

No body — success.

### Blocked if in use

```json
{ "success": false, "message": "Cannot delete customer type with 24 assigned customers" }
```

> The `customerCount` field in the list response tells you whether deletion will be blocked.

---

## Error Responses

**`400` — invalid pricingMode:**

```json
{ "success": false, "message": "Invalid pricing mode" }
```

**`404` — type not found (get/update/delete):**

```json
{ "success": false, "message": "Customer type not found" }
```

**`404` — referenced quantity or item type not found:**

```json
{ "success": false, "message": "Estimated quantity not found: <id>" }
```

**`409` — duplicate name (create/update):**

```json
{ "success": false, "message": "A customer type named \"Hospitality\" already exists" }
```

**`409` — delete blocked by assigned customers:**

```json
{ "success": false, "message": "Cannot delete customer type with 24 assigned customers" }
```

---

## How Pricing Mode Ripples Through the System

```
Customer Type (pricingMode)
│
├── per_bin
│   ├── Customer form: shows Bin Capacity + Assigned BINs
│   ├── Pickup pricing: capacityRate.prepayRate × customer.noBins
│   ├── Subscription pricing: capacityRate.postpayRate × customer.noBins × frequency × cycle
│   └── Pickup form: no truck tier dropdown
│
└── full_truck
    ├── Customer form: hides Bin Capacity + Assigned BINs
    ├── Pickup pricing: truckLoadRate.prepayRate (chosen at booking)
    ├── Subscription pricing: truckLoadRate.postpayRate × frequency × cycle
    └── Pickup form: shows truck tier dropdown (required)
```

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| List customer types | GET | `/api/customer/admin/types` |
| Create customer type | POST | `/api/customer/admin/types` |
| Get customer type | GET | `/api/customer/admin/types/:id` |
| Update customer type | PATCH | `/api/customer/admin/types/:id` |
| Delete customer type | DELETE | `/api/customer/admin/types/:id` |
| List quantities (for multi-select) | GET | `/api/disposable/quantities/active` |
| List item types (for multi-select) | GET | `/api/disposable/item-types/active` |
