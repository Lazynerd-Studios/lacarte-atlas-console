# Frontend (Web Admin) — Truck-Based (`full_truck`) Customers

Covers the **web admin dashboard** for customers whose `customerType.pricingMode === "full_truck"`.
These customers are priced by a **flat truck-load tier** (Quarter / Half / Full Truck) instead of
per bin.

Companion docs: `frontend-web-customer-pricing-mode.md` (mode/type management + per_bin panels),
`frontend-mobile-truck-based-customers.md` (customer app side),
`frontend-web-customer-multi-bin-sizes.md`.

## The model in one paragraph

A truck-based customer does **not** have a bin inventory. Their waste amount is described by a
**truck-load tier** (`truckLoadRate`): a global catalog of options, each with a `prepayRate`
(pay-as-you-go), a `postpayRate` (subscription), and a `binEquivalent` (100 / 200 / 400 — the number
used for driver earnings and load math). The tier is chosen **per booking** for PAYG, or **fixed on
the subscription** for subscribers. `estimatedQuantity` is irrelevant to truck customers (it does not
affect price or `binCount`).

```jsonc
// truckLoadRate (as returned by the API — rates are GHS major units)
{ "id": "…", "label": "Half Truck", "prepayRate": 800, "postpayRate": 600,
  "binEquivalent": 200, "displayOrder": 1, "isActive": true }
```

## 1. Truck tier management (permission `management.rates`)
```
GET    /api/rates/admin/truck-loads?includeInactive=false   → { tiers[…], total }
POST   /api/rates/admin/truck-loads                          → 201 truckLoadRate
PATCH  /api/rates/admin/truck-loads/:id                      → 200 truckLoadRate
DELETE /api/rates/admin/truck-loads/:id                      → 200 { success, message } | 409 | 404
```
Create body:
```jsonc
{
  "label": "Half Truck",
  "prepayRate": 800,        // GHS, PAYG per trip
  "postpayRate": 600,       // GHS, subscription per trip
  "binEquivalent": 200,     // integer ≥ 1 — drives driver earnings & load math
  "displayOrder": 1,        // optional, default 0
  "isActive": true          // optional, default true
}
```
Update body is partial (any subset). **Delete is blocked with `409`** when pickup requests reference
the tier — deactivate it instead (`isActive: false`).

UI notes:
- Deactivating a tier removes it from the public `GET /api/rates/truck-loads` booking menu but keeps
  history intact.
- `binEquivalent` is the number drivers are paid against — treat changes as payout-affecting and
  warn the admin.

## 2. Customer type = where "truck-based" is set
`pricingMode` is chosen on the **customer type**, not the customer:
```
POST  /api/customer/admin/types   { name, pricingMode: "full_truck", … }   // management.customer_types
PATCH /api/customer/admin/types/:id
```
See `frontend-web-customer-pricing-mode.md` §2 for the full type CRUD contract.

## 3. Truck customer detail
Read `customerType.pricingMode` from `GET /api/customer/admin/:id`:
- **Hide the bin editor.** `PUT /api/customer/admin/:id/bins` returns
  `400` "Bin mix is only valid for per-bin customer types" for truck customers.
- Show the customer's **subscription truck tier** (from their subscription) as read-only info.
- `bins[]` is empty for these customers.

## 4. Admin pickup creation on behalf of a truck customer
```
POST /api/pickup-requests/admin     (permission: pickups.manage)
```
```jsonc
{
  "customerId": "…",
  "disposableItemTypeId": "…",
  "preferredPickupDate": "2026-10-25",
  "truckLoadRateId": "…",       // REQUIRED for a full_truck PAYG booking
  "paymentType": "pay_as_you_go" // optional
  // estimatedQuantityId is OPTIONAL — omit it; the server derives a harmless value
}
```

## 5. Load adjustment (driver found more than booked)
```
PATCH /api/pickup-requests/admin/:id/actual-load     (permission: pickups.manage)
Body (truck customer): { "actualTruckLoadRateId": "<uuid>" }   // must be a LARGER tier than booked
```
- Increases only; a pickup can be adjusted once.
- The delta (`actualTier.rate − bookedTier.rate`) is routed to the subscription invoice (postpaid)
  or an immediate payment prompt (prepaid/PAYG).
- Sending `actualBins` for a truck customer, or a non-upgrade tier, returns `400`.

## 6. Error handling
| Status | Cause | UI treatment |
|---|---|---|
| 409 | Delete a truck tier referenced by pickups | Offer "deactivate" instead |
| 400 "Bin mix is only valid for per-bin customer types" | Bin editor on a truck customer | Hide editor (branch on pricingMode) |
| 400 "Truck load size is required…" | Truck PAYG booking without a tier | Require a tier in the form |
| 400 (load adjust) | `actualBins` sent, or tier not an upgrade | Enforce tier-upgrade-only in the UI |
| 401 / 403 | Missing/insufficient permission | Route to login / show forbidden |

## Known caveat (flag for product)
The **zone-schedule generator** builds subscription pickups by summing a customer's bins and does
**not** attach a truck tier. A `full_truck` customer on a zone-scheduled subscription may therefore
get an auto-generated pickup with `binCount = 0` and no tier captured. If truck customers are meant
to receive zone-scheduled pickups, this needs a backend follow-up (tracked with the Option C
`binCount`-unification work). Verify whether truck customers use zone scheduling before relying on
auto-generated pickups for them.

## Test checklist
- Create/edit/deactivate a truck tier; delete is blocked (`409`) once a pickup references it.
- Truck customer detail hides the bin editor; `PUT /:id/bins` returns `400`.
- Admin pickup create for a truck customer requires `truckLoadRateId` (PAYG) and succeeds with it.
- Load adjustment accepts a larger `actualTruckLoadRateId` and rejects `actualBins` / non-upgrades.
- Changing a tier's `binEquivalent` warns the admin (payout impact).
