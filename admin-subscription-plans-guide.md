# Admin Panel Guide: Subscription Plans & Calculated Subscriptions

This guide explains what changed in the Subscription Plans page and what the admin developer needs to know.

## What Changed

### Before (old model)

Admin creates fixed plans. Customers pick a plan and subscribe.

```
┌─────────────────────────────────────────────────────────────────┐
│  Subscription Plans                               [+ Add Plan]  │
│  [Prepaid]  [Postpaid]                                          │
├─────────────────────────────────────────────────────────────────┤
│  Total Plans: 1    1 active    Est. Revenue: GH₵0.10 monthly   │
├─────────────────────────────────────────────────────────────────┤
│  Monthly 240Liters                           1 subs             │
│  🚚 Pickups 4    GH₵0.10    MONTHLY    Prepaid                 │
│  [Deactivate] [Edit] [Delete]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### After (new model)

**Legacy plans still exist and work**, but new subscriptions are **calculated** — customers pick a frequency + billing cycle and the system computes the price from their bin capacity rate. No plan needed.

The admin page keeps its existing plan CRUD **plus** gains visibility into calculated subscriptions.

---

## What STAYS (Legacy Plan Management)

The entire existing page stays: Prepaid/Postpaid tabs, plan cards, Add/Edit/Deactivate/Delete. These manage **legacy fixed plans** for existing subscribers.

> **Important:** Do NOT remove this page. Existing customers on legacy plans continue to use them. Admins can still create fixed plans if needed.

---

## What's NEW: Calculated Subscriptions

Customers now subscribe **without picking a plan**. They choose:
- **Frequency**: weekly (4/month), biweekly (2/month), monthly (1/month)
- **Billing Cycle**: monthly or quarterly
- **Payment Type**: prepaid or postpaid

The price is auto-computed from their bin capacity rate (set in Rate Management).

### How to identify calculated subscriptions

Every subscription response now includes a `pricingSource` field:

| `pricingSource` | Meaning | `plan` field |
|-----------------|---------|--------------|
| `"plan"` | Legacy fixed plan | Plan object (name, price, pickups...) |
| `"calculated"` | New auto-priced | `null` — uses frequency/pickupsPerCycle/amountPerCycle instead |

---

## Updated Subscription Response Shape

When viewing a customer's subscription (e.g. in customer detail), the response now looks like:

### Legacy plan subscription (unchanged):

```json
{
  "paymentPlan": "prepaid",
  "subscription": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-08-01T00:00:00.000Z",
    "outstandingBalance": 0,
    "plan": {
      "id": "plan-uuid...",
      "name": "Monthly 240Liters",
      "description": "Standard residential",
      "type": "prepaid",
      "pickups": 4,
      "bins": 1,
      "billingCycle": "monthly",
      "price": 100.00,
      "badgeColor": "#3B82F6",
      "gracePeriodDays": 7
    },
    "frequency": null,
    "pickupsPerCycle": null,
    "amountPerCycle": null,
    "pricingSource": "plan",
    "payment": { "..." : "..." },
    "createdAt": "2026-07-01T00:00:00.000Z",
    "updatedAt": "2026-07-01T00:00:00.000Z"
  }
}
```

### Calculated subscription (new):

```json
{
  "paymentPlan": "postpaid",
  "subscription": {
    "id": "660f9511-f30c-52e5-b827-557766551111",
    "status": "active",
    "startDate": "2026-08-01T00:00:00.000Z",
    "endDate": "2026-09-01T00:00:00.000Z",
    "outstandingBalance": 0,
    "plan": null,
    "frequency": "weekly",
    "pickupsPerCycle": 4,
    "amountPerCycle": 100.00,
    "pricingSource": "calculated",
    "payment": null,
    "createdAt": "2026-08-01T00:00:00.000Z",
    "updatedAt": "2026-08-01T00:00:00.000Z"
  }
}
```

### UI guidance for displaying subscriptions:

```typescript
if (subscription.pricingSource === "calculated") {
  // Show: "Weekly • 4 pickups/cycle • GHS {amountPerCycle}/cycle"
  // No plan badge
} else {
  // Show: plan.name, plan.pickups, plan.price (existing card layout)
}
```

---

## Legacy Plan CRUD Endpoints (unchanged)

All existing endpoints remain. Permission: `management.subscriptions`.

### API: Dashboard Stats

```http
GET /api/subscription/admin/stats?type=prepaid
Authorization: Bearer <admin-token>
```

**Response `200`:**

```json
{
  "totalPlans": 3,
  "activePlans": 2,
  "subscribers": 15,
  "estimatedRevenue": 1500.00,
  "totalOutstanding": 250.00
}
```

### API: List Plans

```http
GET /api/subscription/admin/plans?type=prepaid&status=active
Authorization: Bearer <admin-token>
```

**Response `200`:**

```json
{
  "plans": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Monthly 240Liters",
      "description": "Standard residential pickup plan",
      "type": "prepaid",
      "pickups": 4,
      "bins": 1,
      "billingCycle": "monthly",
      "price": 100.00,
      "badgeColor": "#3B82F6",
      "gracePeriodDays": 7,
      "isActive": true,
      "deletedAt": null,
      "createdAt": "2026-06-15T10:00:00.000Z",
      "updatedAt": "2026-06-15T10:00:00.000Z",
      "subscriberCount": 12
    }
  ],
  "total": 1
}
```

### API: Create Plan

```http
POST /api/subscription/admin/plans
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request body:**

```json
{
  "name": "Basic Monthly",
  "description": "Standard residential pickup plan.",
  "type": "prepaid",
  "pickups": 4,
  "bins": 1,
  "billingCycle": "monthly",
  "price": 100.00,
  "badgeColor": "#3B82F6",
  "gracePeriodDays": 7,
  "isActive": true
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Unique across all plans |
| `description` | string | No | Max 500 chars |
| `type` | `"prepaid" \| "postpaid"` | Yes | Determines payment flow |
| `pickups` | integer | Yes | Pickups per cycle |
| `bins` | integer | Yes | Number of bins covered |
| `billingCycle` | `"monthly" \| "quarterly" \| "yearly"` | Yes | |
| `price` | number | Yes | GHS major units |
| `badgeColor` | string | Yes | Hex color `#RRGGBB` |
| `gracePeriodDays` | integer | No | Default 7, max 30 |
| `isActive` | boolean | Yes | |

**Response `201`:**

```json
{
  "id": "770a1234-abcd-5678-ef90-123456789abc",
  "name": "Basic Monthly",
  "description": "Standard residential pickup plan.",
  "type": "prepaid",
  "pickups": 4,
  "bins": 1,
  "billingCycle": "monthly",
  "price": 100.00,
  "badgeColor": "#3B82F6",
  "gracePeriodDays": 7,
  "isActive": true,
  "deletedAt": null,
  "createdAt": "2026-08-01T12:00:00.000Z",
  "updatedAt": "2026-08-01T12:00:00.000Z",
  "subscriberCount": 0
}
```

**Response `400` (duplicate name):**

```json
{
  "success": false,
  "message": "Subscription plan name already exists"
}
```

### API: Update Plan

```http
PATCH /api/subscription/admin/plans/770a1234-abcd-5678-ef90-123456789abc
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request body** (all fields optional):

```json
{
  "price": 120.00,
  "pickups": 5
}
```

**Response `200`:**

```json
{
  "id": "770a1234-abcd-5678-ef90-123456789abc",
  "name": "Basic Monthly",
  "description": "Standard residential pickup plan.",
  "type": "prepaid",
  "pickups": 5,
  "bins": 1,
  "billingCycle": "monthly",
  "price": 120.00,
  "badgeColor": "#3B82F6",
  "gracePeriodDays": 7,
  "isActive": true,
  "deletedAt": null,
  "createdAt": "2026-08-01T12:00:00.000Z",
  "updatedAt": "2026-08-01T14:30:00.000Z",
  "subscriberCount": 3
}
```

### API: Toggle Plan Status (Activate/Deactivate)

```http
PATCH /api/subscription/admin/plans/770a1234-abcd-5678-ef90-123456789abc/toggle
Authorization: Bearer <admin-token>
```

**Response `200`:**

```json
{
  "success": true,
  "isActive": false,
  "message": "Subscription plan deactivated"
}
```

### API: Delete Plan (soft delete)

```http
DELETE /api/subscription/admin/plans/770a1234-abcd-5678-ef90-123456789abc
Authorization: Bearer <admin-token>
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Subscription plan deleted"
}
```

**Response `400` (has active subscribers):**

```json
{
  "success": false,
  "message": "Cannot delete plan with active subscribers"
}
```

---

## What to ADD to the Admin Panel (Optional Enhancements)

### 1. Subscription List: Show pricing source

If you have a "Subscribers" or "Active Subscriptions" list view, add a column/badge:

| Badge | Meaning |
|-------|---------|
| `Plan: Monthly 240L` | Legacy plan subscriber |
| `Calculated: Weekly` | Calculated subscription |

### 2. Customer Detail: Handle nullable plan

When showing a customer's subscription, branch on `pricingSource`:

```
pricingSource === "plan"       → show plan card (existing)
pricingSource === "calculated" → show: frequency, pickupsPerCycle, amountPerCycle
```

### 3. Dashboard Stats: Note about calculated revenue

The `estimatedRevenue` in stats only counts **plan-based** subscribers. Calculated subscription revenue is tracked separately. Consider adding a note or a second metric if needed.

---

## Error Responses (all endpoints)

**`401` Unauthorized:**

```json
{ "success": false, "message": "Unauthorized" }
```

**`403` Forbidden:**

```json
{ "success": false, "message": "Forbidden - requires permission: management.subscriptions" }
```

**`404` Not Found:**

```json
{ "success": false, "message": "Subscription plan not found" }
```

**`500` Server Error:**

```json
{ "success": false, "message": "Internal server error" }
```

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Dashboard stats | GET | `/api/subscription/admin/stats?type=prepaid` |
| List plans | GET | `/api/subscription/admin/plans?type=&status=` |
| Get plan by ID | GET | `/api/subscription/admin/plans/:id` |
| Create plan | POST | `/api/subscription/admin/plans` |
| Update plan | PATCH | `/api/subscription/admin/plans/:id` |
| Toggle active/inactive | PATCH | `/api/subscription/admin/plans/:id/toggle` |
| Delete plan | DELETE | `/api/subscription/admin/plans/:id` |
| Public active plans | GET | `/api/subscription/active` |

---

## TL;DR for the Developer

> **Keep the existing Subscription Plans page exactly as-is.** It manages legacy plans and still works.
>
> **What's new:** Customers can now subscribe without a plan (calculated pricing). When you display a customer's subscription, check `pricingSource`:
> - `"plan"` → render the plan card (existing behavior)
> - `"calculated"` → render frequency + pickupsPerCycle + amountPerCycle (plan is `null`)
>
> No new admin pages required. Just handle the nullable `plan` field and show the calculated fields when present.
