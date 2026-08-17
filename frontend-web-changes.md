# Frontend Changes — Web (Admin Dashboard)

Covers all admin-facing changes from the backend specs: `.kiro/specs/payment-state-integrity`, `.kiro/specs/audit-hardening`, `.kiro/specs/subscription-ops-completeness`, and `.kiro/specs/activity-log-consistency`.

Error response shape is unchanged everywhere: `{ "message": "..." }`. All money values are GHS **major units** (e.g. `120.00`, not pesewas).

---

## 1. New endpoints: subscriber management

All routes live under `/api/subscription/admin/subscriptions` and require the existing `management.subscriptions` permission (`401` unauthenticated, `403` missing permission — same as the plan admin routes).

### 1.1 `GET /api/subscription/admin/subscriptions` — list subscribers

Shows **all** customer subscriptions, plan-based **and** calculated.

Query parameters (all optional):

| Param | Values | Notes |
|---|---|---|
| `page` | integer ≥ 1 | default `1` |
| `limit` | integer 1–100 | default `20` |
| `status` | `active` \| `pending` \| `cancelled` \| `expired` \| `past_due` \| `suspended` | |
| `paymentType` | `prepaid` \| `postpaid` | matches the **effective** type (plan type or calculated snapshot) |
| `pricingSource` | `plan` \| `calculated` | |
| `search` | string | matches customer phone number or name (case-insensitive) |

Response `200`:

```json
{
  "data": [
    {
      "id": "uuid-...",
      "customerId": "uuid-...",
      "customerName": "Ama Serwaa",          // nullable
      "customerPhone": "+233201234567",
      "status": "past_due",
      "pricingSource": "calculated",         // "plan" | "calculated"
      "paymentPlan": "postpaid",             // effective type: "prepaid" | "postpaid"
      "plan": null,                          // { "id", "name" } for plan-based subs
      "frequency": "weekly",                 // calculated only, else null
      "pickupsPerCycle": 12,                 // calculated only, else null
      "amountPerCycle": 240.0,               // calculated only (GHS), else null
      "outstandingBalance": 240.0,           // GHS
      "startDate": "2026-07-01T...",
      "endDate": "2026-08-01T...",           // nullable
      "createdAt": "2026-07-01T..."
    }
  ],
  "pagination": {
    "page": 1, "limit": 20, "total": 57, "totalPages": 3,
    "hasNextPage": true, "hasPreviousPage": false
  }
}
```

UI notes:
- `pricingSource: "calculated"` rows have `plan: null` — render `frequency` + `amountPerCycle` instead of a plan name.
- Ordered newest-first (`createdAt` desc).

### 1.2 `GET /api/subscription/admin/subscriptions/:id` — detail

Returns the list item plus `updatedAt` and full `payments[]` history (newest first):

```json
{
  "...item fields...",
  "updatedAt": "...",
  "payments": [
    {
      "id": "uuid-...",
      "amount": 240.0,
      "currency": "GHS",
      "paymentType": "postpaid",
      "status": "paid",                       // "pending" | "paid" | "failed"
      "provider": "blupay",                   // nullable
      "providerRef": "...",                   // nullable
      "paidAt": "2026-07-05T...",             // nullable
      "billingPeriodStart": "...",
      "billingPeriodEnd": "...",
      "createdAt": "..."
    }
  ]
}
```

`404` for unknown ids.

### 1.3 Lifecycle actions

All return `200 { "success": true, "message": "..." }` on success.

| Endpoint | Allowed from | Errors | Side effects |
|---|---|---|---|
| `POST .../:id/cancel` | `active`, `pending` | `400` wrong status, `404` unknown | Fails the sub's pending payments (an in-flight MoMo prompt will no longer charge) |
| `POST .../:id/suspend` | `active`, `past_due` | `400` wrong status, `404` unknown | Customer receives a `subscription_suspended` push notification with the amount due |
| `POST .../:id/reactivate` | `suspended` only | `400` not suspended, **`402` outstanding balance > 0**, `404` unknown | — |
| `POST .../:id/waive-balance` | any status with balance > 0 | `400` balance already zero, `404` unknown | Zeroes `outstandingBalance`, fails the pending payments tied to it; **status is not changed** |

`POST .../:id/waive-balance` request body (optional):

```json
{ "reason": "Goodwill waiver after service outage" }   // max 500 chars
```

Suggested state-machine UI:

| Status | Show |
|---|---|
| `active` | Cancel, Suspend |
| `pending` | Cancel |
| `past_due` | Suspend, Waive (if balance > 0) |
| `suspended` | Reactivate, Waive (if balance > 0) |
| `cancelled` / `expired` | none (terminal) |

For `402` on reactivate, prompt the admin to waive the balance first (or have the customer pay via `/me/pay-balance`).

---

## 2. Changed status codes on existing admin endpoints

| Endpoint | New code | When | Suggested UI handling |
|---|---|---|---|
| `POST /api/pickup-requests/admin` | `400` | Body `paymentType: "subscription"` but the customer has no eligible subscription | Show validation error on the admin booking form |
| `POST /api/pickup-requests/admin` | `402` | Same override, but the subscription has an outstanding balance | Show balance warning |

All other existing codes are unchanged.

---

## 3. Response change: `paymentStatus` can now be `"failed"`

The pickup payment status union gained `"failed"`. Anywhere the dashboard renders `paymentStatus` — `GET /api/pickup-requests/admin/list`, pickup detail payloads, customer records — handle the new value:

```json
{
  "id": "uuid-...",
  "status": "cancelled",
  "paymentType": "pay_as_you_go",
  "paymentStatus": "failed",   // NEW possible value (was: paid | unpaid | pending | active_plan)
  ...
}
```

Recommended treatment: render as "Payment invalidated" / muted badge. It appears when a pickup is cancelled (by the customer, an admin, or a customer suspension) — outstanding charges are invalidated so they can never be collected.

---

## 4. Behavior changes admin screens should reflect

- **Suspending a customer cascades**: their active/pending subscriptions are cancelled (pending payments failed) and all non-final pickups are cancelled. Customer, subscription, and pickup lists change immediately after a suspension — refresh them.
- **Admin cancellation of an assigned/en-route pickup** now also invalidates its unpaid charges (`paymentStatus → "failed"`), including deferred over-quota charges that would otherwise have landed on the subscription invoice.
- **Switching a customer's subscription** (subscribe to a different plan) cancels the old subscription **and fails its pending payment** — an old in-flight MoMo prompt for the previous plan will no longer charge.
- **Late MoMo settlements**: a payment marked `failed` can settle `paid` hours/days later (webhook + periodic polling). Money received for a cancelled subscription/pickup is recorded and flagged for refund review — expect occasional `paid` payments appearing on cancelled entities. A `paid` payment is final and never reverts.

---

## 5. Activity feed: new actions

New actions may appear in activity-log listings — add labels/icons wherever the feed renders action types:

| Action | Meaning |
|---|---|
| `pickup_request.collection_alert` | A pickup was completed while its charge was still unpaid — collections should follow up. `after` contains `paymentId`, `customerId`, `amount` (GHS), `paymentStatus`. |
| `subscription.reactivated` | Admin reactivated a suspended subscription |
| `subscription.balance_waived` | Admin waived an outstanding balance — `after` contains `waivedAmount` (GHS) and `reason` (nullable) |
| `pickup_request.payment_paid` | Pickup payment settled (MoMo). `after` contains `paymentId`, `amount` (GHS), `providerRef`; `cancelledPickup: true` when money arrived for a cancelled/expired pickup (refund review). |
| `pickup_request.payment_failed` | Pickup payment failed at the gateway — `after` contains `paymentId`, `reason` (nullable) |
| `subscription.payment_failed` | Subscription payment failed at the gateway — `after` contains `paymentId`, `reason` (nullable) |
| `subscription.payment_confirmed` | Prepaid subscription activated after payment confirmation |
| `subscription.renewed` | Prepaid renewal confirmed by payment (second producer, alongside manual renewal initiation) |
| `subscription.cycle_billed` | Postpaid cycle invoiced — `after` contains `totalCharge`, `accruedAmount` (GHS), `deferredCount`, `paymentId` |

Also: all status-change entries now use a standardized payload shape — `before: { status }` / `after: { status, ... }`. Any feed parsing that read `after.newStatus` must switch to `after.status` (no `newStatus` keys are written anymore).

---

## 6. No changes required

- Plan admin CRUD (`/admin/plans*`) and `/admin/stats` — unchanged.
- Invoice endpoints — shapes unchanged (invoice status changes and cash settlement behavior are unchanged for now).
- Driver management endpoints — shapes unchanged.
