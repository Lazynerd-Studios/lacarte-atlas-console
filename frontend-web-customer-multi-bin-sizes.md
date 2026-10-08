# Frontend (Web Admin) — Customer Multi-Bin Sizes

Backend contract: `docs/customer-multi-bin-sizes.md`. Per_bin customers now own a **bin
inventory** (list of `{capacity tier, quantity}`) instead of one size + count. This doc lists
every admin-dashboard change required.

## 1. Contract changes you must react to

| Surface | Before | After |
|---|---|---|
| Customer create/sign-up request | `noBins`, `capacityRateId`, `estimatedQuantityId` | **Removed** — sending them is ignored/422; bins are set after creation |
| Customer create response | `noBins`, `capacityRateId` | `bins: []` |
| Customer detail / list item | `noBins`, `capacityRateId`, `capacityRate{id,capacityLiters}` | `bins: [{ quantity, capacityRate: { id, capacityLiters } }]` |
| Admin pickup detail | `customer.noBins` | `customer.bins: [{ quantity, capacityRate: { id, capacityLiters } }]` |
| Pickup row | `binCount` (= old noBins) | `binCount` = **Σ quantity** across the customer's bins |

Action: grep the admin codebase for `noBins` and `capacityRateId` and remove/replace every
usage (table columns, form fields, filters, CSV exports, detail headers).

## 2. New endpoints

### Set a customer's bin mix (replace-all)
```
PUT /api/customer/admin/:id/bins
Body: { "bins": [ { "capacityRateId": "<uuid>", "quantity": 2 } ] }   // ≥1 row, quantity ≥1
200 → [ { "capacityRateId", "capacityLiters", "quantity" } ]
400 → { "message" }   // empty bins | duplicate tier | inactive/unknown tier | full_truck customer
404 → { "message" }
```
- **Replace-all semantics:** the array you send becomes the entire inventory. Always submit the
  complete desired set, never a delta.
- Saving **re-prices the customer's active/pending subscription immediately**; refresh any
  displayed subscription amount after a successful save.

### Tier catalogue for the picker
```
GET /api/rates/capacity        →  { tiers: [{ id, capacityLiters, prepayRate, postpayRate, isActive }], total }
```
Public (no auth). Amounts are GHS **major units** (numbers). The list already contains only
active tiers; admin CRUD for tiers is unchanged (`/api/rates/admin/capacity`).

## 3. Bin editor UI (customer detail + post-create flow)

- Render one row per inventory entry: tier label (`{capacityLiters} L`) + quantity stepper
  (min 1) + remove button; an "Add bin size" control appends a row from the active tier list
  (a tier already in the list must not be offerable twice — duplicates 400).
- Save button calls `PUT /api/customer/admin/:id/bins` with the full array; on success refetch
  the customer (or use the 200 payload) and refresh the subscription panel.
- **Price preview:** compute locally from the tier catalogue —
  `perPickup = Σ(tier.postpayRate × qty)`; `perCycle = perPickup × pickupsPerCycle`
  (`weekly`=4, `biweekly`=2, `monthly`=1 pickups/month × 1 or 3 months per cycle). Show
  "New cycle price: GHS X" before the admin confirms, since saving re-prices immediately.
- **full_truck customers:** hide the editor entirely (the endpoint 400s). Show their truck tier
  from the subscription instead.
- **Empty inventory state:** show a warning banner — the customer cannot subscribe until bins
  are set (`subscribe` returns 400 "Bin capacity not set — contact support").

## 4. Customer creation flow

- Remove bin-size fields from the admin create form. After a successful create, route the admin
  to the bin editor (or show an inline "Set bin sizes" prompt) — a customer without bins cannot
  be subscribed or priced for PAYG.

## 5. Lists, queues and reports

- Customer list: replace the "Bins" column with a compact inventory summary
  (e.g. `1×240 L + 2×660 L`) built from `bins`; keep sorting/filtering as-is (no bin filters
  exist server-side).
- Pickup queue / detail: `binCount` is now the total physical bins; where useful, show the
  per-tier breakdown from `customer.bins` on the admin pickup detail.
- Driver earnings screens: no change needed (they consume server-computed bin totals).

## 6. Error handling

| Status | Meaning | UI treatment |
|---|---|---|
| 422 | Schema violation (qty < 1, empty array, bad uuid) | Inline field errors |
| 400 `Duplicate bin size in payload` | Same tier twice | Merge rows, retry |
| 400 `Bin capacity not found or inactive` | Tier deactivated mid-edit | Refresh picker, notify |
| 400 `Bin mix is only valid for per-bin customer types` | full_truck customer | Hide editor (should not happen) |
| 404 | Customer gone | Reload list |

## 7. Test checklist

- Create customer → set 2 tiers → detail shows both; subscription options/amount reflect Σ.
- Change quantities → subscription amount updates without renewal.
- Remove all rows is impossible via UI (min 1) and 400s via API.
- full_truck customer: editor hidden; API 400.
- Pickup detail shows Σ binCount and the breakdown.
