# Frontend Changes — Web (Admin Dashboard)
## Spec: `zone-pickup-scheduling`

Adds automatic zone-based pickup scheduling: zones carry a pickup schedule, a daily worker creates pickups for subscribed customers 2 days ahead, and admins get a reschedule endpoint as the exception flow.

Error response shape is unchanged: `{ "message": "..." }`. Full behavior reference: `docs/zone-pickup-scheduling.md`.

---

## 1. Zone form — new schedule fields

`POST /zone/admin` and `PATCH /zone/admin/:id` accept six new **optional** fields. No new routes.

| Field | Type | Values |
|---|---|---|
| `pickupDay` | string | `monday`..`sunday` |
| `pickupFrequency` | string | `weekly` \| `biweekly` \| `monthly` |
| `pickupTimeSlot` | string | `morning` \| `afternoon` \| `evening` |
| `weekOfMonth` | integer 1–4 | only meaningful for `monthly` |
| `defaultItemTypeId` | uuid | must be an **active** disposable item type |
| `defaultEstimatedQuantityId` | uuid | must be an **active** estimated quantity |

Form guidance:

- All six optional — a zone may be created/edited with a partial or no schedule. **Generation only happens when all six are set**, so consider marking the schedule "complete" in the UI only then (the API returns each field as-is; null = unset).
- Show `weekOfMonth` only when `pickupFrequency = monthly` (sending it with any other frequency → `400`).
- The defaults dropdowns should filter to active item types / quantities (inactive → `400`).
- On **PATCH**, sending `null` for a schedule field **clears** it (e.g. `{ "pickupDay": null }`). Omitting a field leaves it unchanged. Clearing any of the six disables generation for that zone.

Zone responses (`POST`, `PATCH`, `GET /zone/admin/:id`, `GET /zone/admin/list`) now include the six fields — all nullable:

```json
{
  "pickupDay": "monday",
  "pickupFrequency": "weekly",
  "pickupTimeSlot": "morning",
  "weekOfMonth": null,
  "defaultItemTypeId": "uuid-...",
  "defaultEstimatedQuantityId": "uuid-..."
}
```

New `400` cases to surface:
- `weekOfMonth` without `monthly` frequency.
- Default item type / quantity not found or inactive.

---

## 2. Admin reschedule endpoint (new)

```
PATCH /pickup-requests/admin/:id
{ "preferredPickupDate": "2026-09-02", "timeSlot": "afternoon" }
```

- Requires `pickups.manage`.
- `preferredPickupDate` — ISO date, **tomorrow..+30 days** (same window as customer bookings).
- `timeSlot` — optional; omitted keeps the current slot.
- Success `200` returns the standard detailed pickup response.
- Errors: `400` when the pickup is not `pending` ("Cannot reschedule pickup request after dispatch") or the date is out of window; `404` unknown pickup.

UI suggestion: expose a "Reschedule" action on pending pickups in the pickup queue — especially useful for zone-generated ones, but it works on any pending request.

---

## 3. Generated pickups in the admin pickup list

- Generated pickups appear as **ordinary `pending` requests** — assign/dispatch/track/complete all work as usual. No new statuses or lifecycle.
- They carry `paymentType: "subscription"`. The `source` (`zone_schedule` vs `manual`) and pickup-level `timeSlot` are stored but **not yet exposed** in pickup list/detail responses — no UI distinction required right now.
- The activity log for a generated pickup shows `pickup_request.created` with a **system** actor and description `Pickup auto-scheduled by zone "<name>"`.
- Changing a zone's schedule never moves already-generated pickups — no refresh/migration UI needed.

---

## 4. No changes required

- Driver assignment, dispatch, tracking, load adjustment — unchanged.
- Subscription management screens — unchanged.
- Permissions model — unchanged (reschedule reuses `pickups.manage`; zone routes stay admin-only).
