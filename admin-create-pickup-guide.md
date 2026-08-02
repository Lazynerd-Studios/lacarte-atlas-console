# Admin Panel Guide: Create Pickup Request Changes

This guide explains what changed in the "Create Pickup Request" modal and how to update it.

## What Changed

The pricing model now supports two customer types:
- **`per_bin`** — priced by bin capacity × number of bins (automatic, no extra input needed)
- **`full_truck`** — priced by truck load tier (admin must select a tier)

The create endpoint now accepts an optional `truckLoadRateId` field, and the server auto-resolves the payment type and price.

---

## Updated Modal Layout

### Before (current)

```
┌─────────────────────────────────────────┐
│ Create Pickup Request                   │
│ Payment type: Subscription              │
├─────────────────────────────────────────┤
│ Customer         [Search...]            │
│ Item Type        [Select item type ▼]   │
│ Est. Quantity    [Select quantity ▼]    │
│ Pickup Date      [dd/mm/yyyy 📅]        │
│ ☐ Emergency Pickup                     │
│ Notes            [Optional notes...]    │
│                                         │
│              [Cancel]  [Create Request] │
└─────────────────────────────────────────┘
```

### After (updated)

```
┌─────────────────────────────────────────┐
│ Create Pickup Request                   │
│ Payment type: Auto-resolved             │
├─────────────────────────────────────────┤
│ Customer         [Search...]            │
│ Item Type        [Select item type ▼]   │
│ Est. Quantity    [Select quantity ▼]    │
│                                         │
│ ┌─ (only for full_truck customers) ───┐ │
│ │ Truck Load Tier [Half Truck ▼]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Pickup Date      [dd/mm/yyyy 📅]        │
│ ☐ Emergency Pickup                     │
│ Notes            [Optional notes...]    │
│                                         │
│ ┌─ Price Preview (optional) ──────────┐ │
│ │ GHS 50.00 (per_bin × 2 bins)       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│              [Cancel]  [Create Request] │
└─────────────────────────────────────────┘
```

---

## What to Change

| Change | Details |
|--------|---------|
| **Add** Truck Load Tier dropdown | Show only when selected customer's type is `full_truck` |
| **Update** subtitle | Remove static "Payment type: Subscription" — server resolves it |
| **Optional** Price preview | Call price-preview endpoint after customer selection |
| **Keep** everything else | Item type, quantity, date, emergency, notes — unchanged |

### Conditional logic:

```typescript
// After customer is selected, fetch their profile
const customer = await getCustomer(selectedCustomerId);

if (customer.customerType.pricingMode === "full_truck") {
  showTruckTierDropdown();   // Required for full_truck
  // Estimated Quantity still sent but less relevant
} else {
  hideTruckTierDropdown();   // per_bin — pricing is automatic
}
```

### Truck tier data source:

```http
GET /api/rates/truck-loads
```

```json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "label": "Quarter Truck", "prepayRate": 400.00, "postpayRate": 300.00, "binEquivalent": 100 },
    { "id": "uuid-2", "label": "Half Truck", "prepayRate": 800.00, "postpayRate": 600.00, "binEquivalent": 200 },
    { "id": "uuid-3", "label": "Full Truck", "prepayRate": 1500.00, "postpayRate": 1200.00, "binEquivalent": 400 }
  ]
}
```

---

## API: Create Pickup Request (Admin)

```http
POST /api/pickup-requests/admin
Authorization: Bearer <admin-token>
Content-Type: application/json
```

Permission required: `pickups.manage`

### Request body — per_bin customer

```json
{
  "customerId": "cust-uuid-123",
  "disposableItemTypeId": "item-uuid-456",
  "estimatedQuantityId": "qty-uuid-789",
  "preferredPickupDate": "2026-08-05",
  "additionalNotes": "Please call before arriving",
  "isEmergency": false
}
```

### Request body — full_truck customer

```json
{
  "customerId": "cust-uuid-abc",
  "disposableItemTypeId": "item-uuid-456",
  "estimatedQuantityId": "qty-uuid-789",
  "preferredPickupDate": "2026-08-05",
  "truckLoadRateId": "uuid-2",
  "isEmergency": false,
  "additionalNotes": null
}
```

### Request body — admin forcing payment type

```json
{
  "customerId": "cust-uuid-123",
  "disposableItemTypeId": "item-uuid-456",
  "estimatedQuantityId": "qty-uuid-789",
  "preferredPickupDate": "2026-08-05",
  "paymentType": "subscription"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `customerId` | UUID | Yes | Customer to create for |
| `disposableItemTypeId` | UUID | Yes | Waste item type |
| `estimatedQuantityId` | UUID | Yes | Quantity tier (still required) |
| `preferredPickupDate` | string (date) | Yes | ISO format `YYYY-MM-DD` |
| `truckLoadRateId` | UUID | **Required for full_truck** | Truck tier; rejected for per_bin |
| `paymentType` | `"subscription" \| "pay_as_you_go"` | No | Override auto-resolution |
| `isEmergency` | boolean | No | Same-day urgent (+fee) |
| `additionalNotes` | string | No | Max 500 chars |

---

### Response `201` — per_bin customer with subscription

```json
{
  "id": "req-uuid-001",
  "customerId": "cust-uuid-123",
  "preferredPickupDate": "2026-08-05T00:00:00.000Z",
  "binCount": 2,
  "additionalNotes": "Please call before arriving",
  "status": "pending",
  "paymentType": "subscription",
  "quotaExceeded": false,
  "amount": "0.00",
  "isEmergency": false,
  "emergencyFee": "0.00",
  "qrCodeData": "LAC:req-uuid-001:abc123",
  "createdAt": "2026-08-01T18:00:00.000Z",
  "updatedAt": "2026-08-01T18:00:00.000Z",
  "disposableItemType": {
    "id": "item-uuid-456",
    "name": "General Waste",
    "description": "Standard household waste",
    "icon": null
  },
  "estimatedQuantity": {
    "id": "qty-uuid-789",
    "label": "Small",
    "description": "1-2 bags"
  },
  "customer": {
    "id": "cust-uuid-123",
    "phoneNumber": "+233201234567",
    "address": "12 Ring Road",
    "city": "Accra"
  }
}
```

### Response `201` — per_bin customer PAYG (no subscription)

```json
{
  "id": "req-uuid-002",
  "customerId": "cust-uuid-123",
  "preferredPickupDate": "2026-08-05T00:00:00.000Z",
  "binCount": 2,
  "additionalNotes": null,
  "status": "pending",
  "paymentType": "pay_as_you_go",
  "quotaExceeded": false,
  "amount": "50.00",
  "isEmergency": false,
  "emergencyFee": "0.00",
  "qrCodeData": "LAC:req-uuid-002:def456",
  "createdAt": "2026-08-01T18:00:00.000Z",
  "updatedAt": "2026-08-01T18:00:00.000Z",
  "disposableItemType": {
    "id": "item-uuid-456",
    "name": "General Waste",
    "description": "Standard household waste",
    "icon": null
  },
  "estimatedQuantity": {
    "id": "qty-uuid-789",
    "label": "Small",
    "description": "1-2 bags"
  },
  "customer": {
    "id": "cust-uuid-123",
    "phoneNumber": "+233201234567",
    "address": "12 Ring Road",
    "city": "Accra"
  }
}
```

### Response `201` — full_truck customer PAYG

```json
{
  "id": "req-uuid-003",
  "customerId": "cust-uuid-abc",
  "preferredPickupDate": "2026-08-05T00:00:00.000Z",
  "binCount": 200,
  "additionalNotes": null,
  "status": "pending",
  "paymentType": "pay_as_you_go",
  "quotaExceeded": false,
  "amount": "800.00",
  "isEmergency": false,
  "emergencyFee": "0.00",
  "qrCodeData": "LAC:req-uuid-003:ghi789",
  "createdAt": "2026-08-01T18:00:00.000Z",
  "updatedAt": "2026-08-01T18:00:00.000Z",
  "disposableItemType": {
    "id": "item-uuid-456",
    "name": "Construction Debris",
    "description": "Building and renovation waste",
    "icon": null
  },
  "estimatedQuantity": {
    "id": "qty-uuid-789",
    "label": "Full Truck",
    "description": "Full truck load"
  },
  "customer": {
    "id": "cust-uuid-abc",
    "phoneNumber": "+233209876543",
    "address": "Hospital Road",
    "city": "Kumasi"
  }
}
```

### Response `201` — emergency pickup

```json
{
  "id": "req-uuid-004",
  "customerId": "cust-uuid-123",
  "preferredPickupDate": "2026-08-01T00:00:00.000Z",
  "binCount": 1,
  "additionalNotes": "Urgent - overflow",
  "status": "pending",
  "paymentType": "pay_as_you_go",
  "quotaExceeded": false,
  "amount": "35.00",
  "isEmergency": true,
  "emergencyFee": "10.00",
  "qrCodeData": "LAC:req-uuid-004:jkl012",
  "createdAt": "2026-08-01T18:00:00.000Z",
  "updatedAt": "2026-08-01T18:00:00.000Z",
  "disposableItemType": { "id": "item-uuid-456", "name": "General Waste", "description": "Standard household waste", "icon": null },
  "estimatedQuantity": { "id": "qty-uuid-789", "label": "Small", "description": "1-2 bags" },
  "customer": { "id": "cust-uuid-123", "phoneNumber": "+233201234567", "address": "12 Ring Road", "city": "Accra" }
}
```

> `amount` = base (25.00) + emergencyFee (10.00) = 35.00

---

## Error Responses

**`400` — full_truck customer without truckLoadRateId:**

```json
{ "success": false, "message": "Truck load size is required for full-truck subscriptions" }
```

**`400` — per_bin customer sends truckLoadRateId:**

```json
{ "success": false, "message": "truckLoadRateId is only valid for full-truck customer types" }
```

**`400` — truckLoadRateId inactive/unknown:**

```json
{ "success": false, "message": "Truck load rate not found or inactive" }
```

**`402` — customer has outstanding balance:**

```json
{ "success": false, "message": "Cannot request pickup while there is an outstanding balance on your subscription" }
```

**`404` — customer not found:**

```json
{ "success": false, "message": "Customer not found" }
```

---

## Optional: Price Preview

Call this after the admin selects a customer (and truck tier if applicable) to show the price before creating:

```http
GET /api/pickup-requests/price-preview?truckLoadRateId=uuid-2&isEmergency=false
Authorization: Bearer <admin-token>
```

> Note: This endpoint uses **customer auth** (`requireCustomer`). For admin preview, you can compute it client-side or skip this and rely on the `amount` field in the create response.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "base": 800.00,
    "emergencyFee": 0,
    "total": 800.00,
    "currency": "GHS",
    "pricingMode": "full_truck",
    "source": "truck"
  }
}
```

| `source` value | Meaning |
|----------------|---------|
| `"capacity"` | Priced from capacity rate × bins |
| `"truck"` | Priced from truck load tier |
| `"legacy"` | Priced from old pickup_rate table (unmigrated customer) |
| `"none"` | Subscription — no charge (GHS 0) |

---

## Response Field Guide

| Field | Type | Description |
|-------|------|-------------|
| `paymentType` | `"subscription" \| "pay_as_you_go"` | Auto-resolved by server |
| `quotaExceeded` | boolean | `true` if customer has subscription but quota is used up |
| `amount` | string | Total charge in GHS ("0.00" for subscription) |
| `isEmergency` | boolean | Whether emergency fee applies |
| `emergencyFee` | string | Emergency portion in GHS |
| `binCount` | integer \| null | Snapshot: per_bin → customer.noBins, full_truck → binEquivalent |
| `qrCodeData` | string \| null | QR verification code for driver |

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Create pickup (admin) | POST | `/api/pickup-requests/admin` |
| List truck tiers (for dropdown) | GET | `/api/rates/truck-loads` |
| Set emergency fee | PUT | `/api/pickup-requests/admin/emergency-fee` |
| Get emergency fee config | GET | `/api/pickup-requests/admin/emergency-fee` |
