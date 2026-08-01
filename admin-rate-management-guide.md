# Admin Panel Guide: Rate Management Redesign

This guide explains what changed in the Rate Management page and exactly what to build.

## What Changed

### Before (old model)

One rate table: **Customer Type × Estimated Quantity → single rate**

```
┌─────────────────────────────────────────────────────────────────┐
│  Pay-as-you-go Rates                              [+ Add Rate]  │
├──────────────┬──────────────┬────────────┬───────────┬──────────┤
│ Customer Type│ Est. Quantity│ Rate (GHS) │ Eff. Date │ Actions  │
├──────────────┼──────────────┼────────────┼───────────┼──────────┤
│ Hospitality  │ Small        │ 1.12       │ 2026-04-11│ Edit/Del │
│ Government   │ Half Truck   │ 0.50       │ 2026-06-30│ Edit/Del │
└──────────────┴──────────────┴────────────┴───────────┴──────────┘
```

### After (new model)

Two independent price tables. **Rates are no longer tied to customer types.**

- **Capacity Tiers** — bin sizes with prepay/postpay rates (for households, shops)
- **Truck Load Tiers** — flat per-trip rates (for hospitals, factories)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Capacity Tiers]  [Truck Load Tiers]             [+ Add Tier]  │
├──────────────┬────────────┬─────────────┬────────┬──────────────┤
│ Bin Capacity │ Prepay     │ Postpay     │ Status │ Actions      │
├──────────────┼────────────┼─────────────┼────────┼──────────────┤
│ 120L         │ GHS 25.00  │ GHS 15.00   │ Active │ Edit / Off   │
│ 240L         │ GHS 35.00  │ GHS 25.00   │ Active │ Edit / Off   │
│ 660L         │ GHS 100.00 │ GHS 75.00   │ Active │ Edit / Off   │
│ 1100L        │ GHS 200.00 │ GHS 125.00  │ Active │ Edit / Off   │
└──────────────┴────────────┴─────────────┴────────┴──────────────┘
```

---

## What to REMOVE

- The old "Add Pay-as-you-go Rate" modal (Customer Type, Estimated Quantity, Effective Date, Note fields)
- The old table columns: Customer Type, Est. Quantity, Effective Date, Created
- Summary cards "Total Rates" and "Customer Types" (replace with tier counts)

> The old endpoints (`/api/rates/admin`) still exist for legacy data viewing, but **new rates are not created there**. You can hide that section or label it "Legacy Rates (read-only)".

---

## What to BUILD

### Layout: Two Tabs

```
[Capacity Tiers]  [Truck Load Tiers]
```

---

## Tab 1: Capacity Tiers

### Table Columns

| Column | Field | Notes |
|--------|-------|-------|
| Bin Capacity | `capacityLiters` | Show as "120L", "240L" |
| Prepay Rate | `prepayRate` | GHS, per pickup per bin |
| Postpay Rate | `postpayRate` | GHS, per pickup per bin (subscriptions) |
| Status | `isActive` | Green "Active" / Grey "Inactive" badge |
| Actions | — | Edit, Deactivate/Activate, Delete |

### Add/Edit Modal Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Capacity (Liters) | Number | Yes | e.g. 120, 240, 660, 1100 |
| Prepay Rate (GHS) | Decimal | Yes | Per pickup, per bin |
| Postpay Rate (GHS) | Decimal | Yes | Per pickup, per bin |
| Active | Toggle | — | Default ON |

### Business Rules

- Only **one active tier per capacity** — creating a new 240L tier auto-deactivates the old one
- DELETE blocked (409) if customers are assigned → show toast: *"Cannot delete — customers use this tier. Deactivate instead."*
- Rates are in **GHS major units** (e.g. `25.00`), not pesewas

---

### API: List Capacity Tiers

```http
GET /api/rates/admin/capacity?includeInactive=true
Authorization: Bearer <admin-token>
```

**Response `200`:**

```json
{
  "tiers": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "capacityLiters": 120,
      "prepayRate": 25.00,
      "postpayRate": 15.00,
      "isActive": true,
      "createdAt": "2026-07-15T10:00:00.000Z",
      "updatedAt": "2026-07-15T10:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "capacityLiters": 240,
      "prepayRate": 35.00,
      "postpayRate": 25.00,
      "isActive": true,
      "createdAt": "2026-07-15T10:01:00.000Z",
      "updatedAt": "2026-07-15T10:01:00.000Z"
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "capacityLiters": 660,
      "prepayRate": 100.00,
      "postpayRate": 75.00,
      "isActive": false,
      "createdAt": "2026-07-15T10:02:00.000Z",
      "updatedAt": "2026-07-20T14:30:00.000Z"
    }
  ],
  "total": 3
}
```

### API: Create Capacity Tier

```http
POST /api/rates/admin/capacity
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request body:**

```json
{
  "capacityLiters": 1100,
  "prepayRate": 200.00,
  "postpayRate": 125.00,
  "isActive": true
}
```

**Response `201`:**

```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "capacityLiters": 1100,
  "prepayRate": 200.00,
  "postpayRate": 125.00,
  "isActive": true,
  "createdAt": "2026-08-01T12:00:00.000Z",
  "updatedAt": "2026-08-01T12:00:00.000Z"
}
```

### API: Update Capacity Tier

```http
PATCH /api/rates/admin/capacity/d4e5f6a7-b8c9-0123-defa-234567890123
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request body** (all fields optional):

```json
{
  "prepayRate": 220.00,
  "postpayRate": 140.00
}
```

**Response `200`:**

```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "capacityLiters": 1100,
  "prepayRate": 220.00,
  "postpayRate": 140.00,
  "isActive": true,
  "createdAt": "2026-08-01T12:00:00.000Z",
  "updatedAt": "2026-08-01T15:30:00.000Z"
}
```

### API: Delete Capacity Tier

```http
DELETE /api/rates/admin/capacity/d4e5f6a7-b8c9-0123-defa-234567890123
Authorization: Bearer <admin-token>
```

**Response `200` (success):**

```json
{
  "success": true,
  "message": "Capacity rate tier deleted"
}
```

**Response `409` (blocked — customers linked):**

```json
{
  "success": false,
  "message": "Cannot delete capacity rate — 12 customers are assigned to this tier. Deactivate it instead."
}
```

---

## Tab 2: Truck Load Tiers

### Table Columns

| Column | Field | Notes |
|--------|-------|-------|
| Label | `label` | e.g. "Quarter Truck", "Half Truck" |
| Prepay Rate | `prepayRate` | GHS, flat per trip |
| Postpay Rate | `postpayRate` | GHS, flat per trip |
| Bin Equivalent | `binEquivalent` | Internal (100/200/400) — show as tooltip or small text |
| Order | `displayOrder` | Sort order for mobile dropdown |
| Status | `isActive` | Badge |
| Actions | — | Edit, Deactivate/Activate, Delete |

### Add/Edit Modal Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Label | Text | Yes | e.g. "Full Truck" |
| Prepay Rate (GHS) | Decimal | Yes | Flat per trip |
| Postpay Rate (GHS) | Decimal | Yes | Flat per trip |
| Bin Equivalent | Number | Yes | 100 / 200 / 400 |
| Display Order | Number | — | Default 0 |
| Active | Toggle | — | Default ON |

### Business Rules

- DELETE blocked (409) if any pickup request references the tier
- `binEquivalent` feeds the driver earnings pipeline — explain as tooltip: *"Used internally to calculate driver pay. Quarter=100, Half=200, Full=400."*

---

### API: List Truck Load Tiers

```http
GET /api/rates/admin/truck-loads?includeInactive=true
Authorization: Bearer <admin-token>
```

**Response `200`:**

```json
{
  "tiers": [
    {
      "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
      "label": "Quarter Truck",
      "prepayRate": 400.00,
      "postpayRate": 300.00,
      "binEquivalent": 100,
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "2026-07-15T10:00:00.000Z",
      "updatedAt": "2026-07-15T10:00:00.000Z"
    },
    {
      "id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
      "label": "Half Truck",
      "prepayRate": 800.00,
      "postpayRate": 600.00,
      "binEquivalent": 200,
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2026-07-15T10:01:00.000Z",
      "updatedAt": "2026-07-15T10:01:00.000Z"
    },
    {
      "id": "a7b8c9d0-e1f2-3456-abcd-567890123456",
      "label": "Full Truck",
      "prepayRate": 1500.00,
      "postpayRate": 1200.00,
      "binEquivalent": 400,
      "displayOrder": 2,
      "isActive": true,
      "createdAt": "2026-07-15T10:02:00.000Z",
      "updatedAt": "2026-07-15T10:02:00.000Z"
    }
  ],
  "total": 3
}
```

### API: Create Truck Load Tier

```http
POST /api/rates/admin/truck-loads
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request body:**

```json
{
  "label": "Three-Quarter Truck",
  "prepayRate": 1100.00,
  "postpayRate": 900.00,
  "binEquivalent": 300,
  "displayOrder": 3,
  "isActive": true
}
```

**Response `201`:**

```json
{
  "id": "b8c9d0e1-f2a3-4567-bcde-678901234567",
  "label": "Three-Quarter Truck",
  "prepayRate": 1100.00,
  "postpayRate": 900.00,
  "binEquivalent": 300,
  "displayOrder": 3,
  "isActive": true,
  "createdAt": "2026-08-01T12:00:00.000Z",
  "updatedAt": "2026-08-01T12:00:00.000Z"
}
```

### API: Update Truck Load Tier

```http
PATCH /api/rates/admin/truck-loads/b8c9d0e1-f2a3-4567-bcde-678901234567
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request body** (all fields optional):

```json
{
  "prepayRate": 1200.00,
  "postpayRate": 950.00
}
```

**Response `200`:**

```json
{
  "id": "b8c9d0e1-f2a3-4567-bcde-678901234567",
  "label": "Three-Quarter Truck",
  "prepayRate": 1200.00,
  "postpayRate": 950.00,
  "binEquivalent": 300,
  "displayOrder": 3,
  "isActive": true,
  "createdAt": "2026-08-01T12:00:00.000Z",
  "updatedAt": "2026-08-01T16:45:00.000Z"
}
```

### API: Delete Truck Load Tier

```http
DELETE /api/rates/admin/truck-loads/b8c9d0e1-f2a3-4567-bcde-678901234567
Authorization: Bearer <admin-token>
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Truck load rate tier deleted"
}
```

**Response `409` (blocked):**

```json
{
  "success": false,
  "message": "Cannot delete truck load rate — 5 pickup requests reference this tier. Deactivate it instead."
}
```

---

## Additional Change: Customer Type Form

Add a **Pricing Mode** field to the Customer Type create/edit form:

| Field | Type | Options | Default |
|-------|------|---------|---------|
| Pricing Mode | Radio / Select | `per_bin` / `full_truck` | `per_bin` |

**Where:** `POST /api/customer/admin/types` and `PATCH /api/customer/admin/types/:id`

```json
{
  "name": "Hospital / Factory",
  "pricingMode": "full_truck"
}
```

This determines how customers of that type get priced. Show a helper text:
- `per_bin`: "Customers priced by bin size × number of bins"
- `full_truck`: "Customers priced by truck load tier (flat per trip)"

---

## Additional Change: Customer Form

When creating/editing a customer whose type is `per_bin`, add a **Bin Capacity** dropdown:

- Data source: `GET /api/rates/admin/capacity` (active tiers only)
- Display: "120L — GHS 25/pickup" (show capacity + prepay rate)
- Field: `capacityRateId` (UUID)

```json
{
  "capacityRateId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "noBins": 2
}
```

For `full_truck` customers: hide the capacity dropdown (they pick a truck tier at booking time, not at profile level).

---

## Error Responses (all endpoints)

**`401` Unauthorized:**

```json
{ "success": false, "message": "Unauthorized" }
```

**`403` Forbidden (missing permission):**

```json
{ "success": false, "message": "Forbidden - requires permission: management.rates" }
```

**`404` Not Found:**

```json
{ "success": false, "message": "Capacity rate not found" }
```

**`500` Server Error:**

```json
{ "success": false, "message": "Internal server error" }
```

---

## Seed Data (Client's Rate Table)

Use these values when first populating the tiers:

### Capacity Tiers

| Capacity | Prepay (GHS/bin) | Postpay (GHS/bin) |
|----------|-----------------|-------------------|
| 120L | 25.00 | 15.00 |
| 240L | 35.00 | 25.00 |
| 660L | 100.00 | 75.00 |
| 1100L | 200.00 | 125.00 |

### Truck Load Tiers

| Label | Prepay (GHS/trip) | Postpay (GHS/trip) | Bin Equiv |
|-------|------------------|-------------------|-----------|
| Quarter Truck | TBD | TBD | 100 |
| Half Truck | TBD | TBD | 200 |
| Full Truck | TBD | TBD | 400 |

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| List capacity tiers (admin) | GET | `/api/rates/admin/capacity?includeInactive=true` |
| Create capacity tier | POST | `/api/rates/admin/capacity` |
| Update capacity tier | PATCH | `/api/rates/admin/capacity/:id` |
| Delete capacity tier | DELETE | `/api/rates/admin/capacity/:id` |
| List truck tiers (admin) | GET | `/api/rates/admin/truck-loads?includeInactive=true` |
| Create truck tier | POST | `/api/rates/admin/truck-loads` |
| Update truck tier | PATCH | `/api/rates/admin/truck-loads/:id` |
| Delete truck tier | DELETE | `/api/rates/admin/truck-loads/:id` |
| List capacity tiers (public) | GET | `/api/rates/capacity` |
| List truck tiers (public) | GET | `/api/rates/truck-loads` |
