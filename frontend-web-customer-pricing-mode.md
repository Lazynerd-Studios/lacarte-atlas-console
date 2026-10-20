# Frontend (Web Admin) — Customer Pricing Mode

Companion to `docs/frontend-mobile-customer-pricing-mode.md` (customer app). This doc covers the
**admin dashboard** side of `customerType.pricingMode` — the field that decides whether a customer
is priced **per bin** or by a **flat truck load**.

Key mental model: **pricing mode is a property of the customer *type*, not the customer.** The
admin sets it once when creating/editing a type; every customer of that type inherits it. There is
no per-customer "truck-based" toggle.

- `"per_bin"` → priced from the customer's bin inventory (Σ capacity × quantity). Admin manages bins.
- `"full_truck"` → priced by a truck-load tier (Quarter / Half / Full). Admin manages tiers, not bins.

## 1. Where pricingMode appears (read surfaces)

`pricingMode` is returned inside `customerType` on every customer read/write response, and as a
top-level field on customer-type responses:

| Endpoint | Permission | Shape |
|---|---|---|
| `GET /api/customer/admin/list` | `customers.view` | list item → `customerType.pricingMode` |
| `GET /api/customer/admin/:id` | `customers.view` | `customerType.pricingMode`, `bins[]`, `defaultEstimatedQuantityId` |
| `PATCH /api/customer/admin/:id` | `customers.view` | returns updated `AdminCustomerResponse` |
| `POST /api/customer/admin` | `customers.create` | `SignUpResponse` → `customerType.pricingMode` |
| `GET /api/customer/admin/types` | `management.customer_types` | `CustomerTypeItem[]` → top-level `pricingMode` |
| `GET /api/customer/types` | public | `CustomerTypeItem[]` → top-level `pricingMode` |

Example (`GET /api/customer/admin/:id`, trimmed):
```jsonc
{
  "id": "…",
  "displayName": "Acme Estates",
  "defaultItemTypeId": "…",
  "defaultEstimatedQuantityId": "…",     // per-customer booking default (nullable)
  "bins": [],                             // empty for full_truck
  "customerType": {
    "id": "…",
    "name": "Estate",
    "pricingMode": "full_truck",          // ← drive the UI from this
    "requiresEntityName": true,
    "entityNameLabel": "Estate name"
  }
}
```

## 2. Setting pricingMode — Customer Type CRUD

This is the **only** place pricing mode is chosen.

```
GET    /api/customer/admin/types            → CustomerTypeItem[]
POST   /api/customer/admin/types            → 201 CustomerTypeItem
GET    /api/customer/admin/types/:id        → CustomerTypeItem
PATCH  /api/customer/admin/types/:id        → 200 CustomerTypeItem
DELETE /api/customer/admin/types/:id        → 204  (409 if customers are still assigned)
```
All require `management.customer_types`.

**Create body** (`CustomerTypeCreateRequest`):
```jsonc
{
  "name": "Estate",
  "pricingMode": "full_truck",        // optional; defaults to "per_bin"
  "requiresEntityName": true,         // optional; default false
  "entityNameLabel": "Estate name",   // optional
  "estimatedQuantityIds": ["…"],      // optional; omit/empty = type sees ALL active quantities
  "disposableItemTypeIds": ["…"]      // optional; omit/empty = type sees ALL active item types
}
```
**Update body** (`CustomerTypeUpdateRequest`): `name` is required; `pricingMode`,
`requiresEntityName`, `entityNameLabel`, and the two id arrays are optional (omitted = untouched;
a provided array **replaces** that association set).

`CustomerTypeItem` also returns `customerCount`, `estimatedQuantities[]` (with `binCount`), and
`disposableItemTypes[]` — useful for the type list/edit screens.

### UI guidance
- Type editor: a **Pricing mode** selector (`per_bin` | `full_truck`). Warn before changing mode on
  a type that already has customers — it changes how they are priced and whether bins apply.
- The `estimatedQuantityIds` / `disposableItemTypeIds` pickers define the per-type booking menu.
  Leaving them empty means "all active options" (default-all rule).

## 3. Customer detail — branch the panels on pricingMode

Read `customerType.pricingMode` from `GET /api/customer/admin/:id` and render accordingly:

| Panel | `per_bin` | `full_truck` |
|---|---|---|
| **Bin inventory editor** (`PUT /api/customer/admin/:id/bins`) | Show | **Hide** — the endpoint returns `400` for full_truck |
| **Truck tier info** | Hide | Show the tier from the customer's subscription (see §5) |
| `bins[]` in response | Populated | Empty `[]` |

Bin editor contract (per_bin only) — see `docs/frontend-web-customer-multi-bin-sizes.md`:
```
PUT /api/customer/admin/:id/bins
Body: { "bins": [ { "capacityRateId": "<uuid>", "quantity": 2 } ] }   // replace-all, ≥1 row
200 → [ { "capacityRateId", "capacityLiters", "quantity" } ]
400 → empty | duplicate tier | inactive tier | full_truck customer
```

## 4. Per-customer pickup defaults

`defaultItemTypeId` and `defaultEstimatedQuantityId` are **nullable** preferences stored on the
customer. They drive what the zone-schedule generator books automatically, and — as of the
`pickup-optional-estimated-quantity` change — they are the **server-side fallback when a pickup is
created without an explicit quantity** (see §5).

- Set/clear them via `PATCH /api/customer/admin/:id` (fields accept `null` to clear).
- They are **not** part of `POST /api/customer/admin` (create) — set them in a follow-up edit.
- A stored default must be an active quantity available to the customer's type; if it isn't, the
  server silently falls back to the type's lowest-`displayOrder` active quantity.

## 5. Admin pickup creation & load adjustment

### Create on behalf of a customer
```
POST /api/pickup-requests/admin        (permission: pickups.manage)
```
```jsonc
{
  "customerId": "…",
  "disposableItemTypeId": "…",
  "preferredPickupDate": "2026-10-25",
  "estimatedQuantityId": "…",   // OPTIONAL now — omit to use the customer's default / type fallback
  "truckLoadRateId": "…",       // REQUIRED for a full_truck customer on a pay-as-you-go booking
  "paymentType": "pay_as_you_go" // optional; omit to auto-resolve subscription vs PAYG
}
```
- **`estimatedQuantityId` is optional.** When omitted the server derives it:
  customer's `defaultEstimatedQuantityId` (if active + available to the type) → else the type's
  lowest-`displayOrder` active quantity → else `400` "No estimated quantity is configured for this
  customer type".
- For a **full_truck** customer the quantity is cosmetic (price and `binCount` come from the truck
  tier). You may omit `estimatedQuantityId` entirely; just send `truckLoadRateId`.
- Truck tier catalogue for the picker: `GET /api/rates/truck-loads` (public) — admin CRUD lives at
  `GET|POST /api/rates/admin/truck-loads` and `PATCH|DELETE /api/rates/admin/truck-loads/:id`
  (permission `management.rates`).

### Load adjustment (after booking)
```
PATCH /api/pickup-requests/admin/:id/actual-load     (permission: pickups.manage)
Body: { "actualBins": 4 }                 // per_bin customers
   or { "actualTruckLoadRateId": "<uuid>" } // full_truck customers (a larger tier)
```
Increases only; a pickup can be adjusted once. Routes the delta to the subscription invoice
(postpaid) or an immediate payment prompt (prepaid/PAYG). See `docs/customer-multi-bin-sizes.md`
and the `pickup-load-adjustment` spec.

## 6. Error handling

| Status | Cause | UI treatment |
|---|---|---|
| 400 "Bin mix is only valid for per-bin customer types" | Bin editor on a full_truck customer | Hide the editor (branch on pricingMode) |
| 400 "No estimated quantity is configured for this customer type" | Pickup create, quantity omitted, type has no active/available quantity | Prompt admin to attach quantities to the type (§2) |
| 400 "Truck load size is required for this customer type" | full_truck PAYG pickup without `truckLoadRateId` | Require a tier in the form |
| 409 | Delete a customer type still in use | Show `customerCount`, block delete |
| 401 / 403 | Missing/insufficient permission | Route to login / show forbidden |

## 7. Test checklist

- Create a `full_truck` type → its customers' detail hides the bin editor and shows truck info.
- Create a `per_bin` type → bin editor available; `PUT /:id/bins` saves and re-prices.
- Customer list & detail render `customerType.pricingMode`; filters/badges can use it.
- `PATCH /customer/admin/:id` sets `defaultEstimatedQuantityId`; clearing with `null` works.
- Admin pickup create **without** `estimatedQuantityId`:
  - customer with a valid default → stored quantity = that default;
  - customer with no default → type's lowest-`displayOrder` quantity;
  - type with no active quantity → `400`.
- Admin pickup create for a full_truck customer requires `truckLoadRateId` (PAYG) and succeeds with it.
- Delete a type with customers → `409`.
