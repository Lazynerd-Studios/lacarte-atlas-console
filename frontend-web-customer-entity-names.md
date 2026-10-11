# Frontend (Web Admin) — Customer Entity Names

Backend contract: [`docs/customer-entity-names.md`](./customer-entity-names.md).

Customer categories can now declare that their customers are **businesses**. When a category
does, every customer in it must carry a business name, and every list renders one unambiguous
Name. This doc lists each admin-dashboard change required.

## 1. Contract changes you must react to

| Surface | Before | After |
|---|---|---|
| Customer type payload | `{ id, name, pricingMode, customerCount, … }` | **+ `requiresEntityName: boolean`, `entityNameLabel: string \| null`** |
| Customer type create/update request | `name`, `pricingMode`, association id arrays | **+ optional `requiresEntityName`, `entityNameLabel`** |
| Customer create request (sign-up + admin) | no business-name field | **+ optional `entityName`** — required when the type's flag is on, must be **omitted** when off |
| Customer update request (`PATCH /customer/me`, `PATCH /customer/admin/:id`) | no business-name field | **+ optional `entityName`** |
| Customer detail / list item | `user.name` only | **+ `entityName` (nullable), `displayName` (always a string)** |
| Customer list query | `search` matched email / person name / phone | `search` also matches **business name**; **+ `missingEntityName=true`** filter |
| Pickup admin list + detail | `customer.name` | **+ `customer.displayName`** |
| Invoice detail Bill-To | `customer.name` | **+ `customer.displayName`** |
| Invoice list | `customerName` = person name | `customerName` = **display name** |

Action: grep the dashboard for `customer.user.name` / `customer.name` in list and detail views
and switch the **primary** label to `displayName`, keeping the raw person name for a secondary
line where the layout has room.

## 2. Customer-type form (Settings → Customer Categories)

Add two controls to the create and edit dialogs:

1. **Toggle** — "Customers are businesses" → `requiresEntityName`.
2. **Conditional text input** — "Business-name field label" → `entityNameLabel`, max 60 chars,
   only shown when the toggle is on. Placeholder: `Business name`. Helper text:
   *"What the customer form should call this field, e.g. Estate name, Hotel name."*

```jsonc
// PATCH /api/customer/admin/types/:id
{
  "name": "Estates",              // REQUIRED — pre-existing contract, always send it
  "requiresEntityName": true,
  "entityNameLabel": "Estate name"
}
```

Two gotchas:

- **`name` is required on PATCH.** A flag-only toggle must still send the current name, or the
  request 422s. Pre-fill it from the row you are editing.
- **Omit vs null differ for the label.** Omit `entityNameLabel` to leave it untouched; send
  `null` to clear it back to the default.

Warn the admin when they turn the toggle **on** for a category that already has customers:
existing customers are *not* modified and keep no business name until edited. Suggest the
backlog filter (§5) as the follow-up. Turning the toggle off does not delete stored names, but
they stop being displayed as the primary identity only if the customer is later edited (an edit
under a non-entity type clears the value).

## 3. Customer create / edit form

Drive the field entirely from the selected category:

```ts
const type = customerTypes.find((t) => t.id === form.customerTypeId);
const needsEntityName = type?.requiresEntityName ?? false;
const fieldLabel = type?.entityNameLabel ?? 'Business name';
```

- `needsEntityName === true` → render a **required** text input labelled `fieldLabel`,
  max 150 chars, trimmed on submit.
- `needsEntityName === false` → **do not render the field, and do not send the key.** Sending
  `entityName: ""` for a non-entity category is rejected with 400
  (`Business name is not allowed for this customer type`). Omit the key or send `null`.
- Changing the category selector must re-evaluate both the visibility and the label live.

On the **edit** form, when the admin changes the category:

| Direction | Behaviour you must handle |
|---|---|
| non-entity → entity, customer has no stored name | `entityName` becomes **required in this same request**; the API rejects the switch without it |
| non-entity → entity, customer already has a name | Nothing required; the stored value is kept |
| entity → non-entity | The stored business name is **cleared to null** by the API. Show a confirmation: *"Switching this customer to a non-business category removes their business name."* |

For a category whose flag is on, an edit that does **not** touch the business name may omit the
key entirely — the stored value is preserved. Unrelated edits (address, zone, phone, pickup
defaults) are never blocked by a missing business name.

## 4. Lists — one Name column

Render `displayName` as the primary Name everywhere a customer identity appears: customer list,
customer detail header, pickup queue, pickup detail, invoice list and invoice Bill-To.

Recommended two-line treatment where the row height allows:

```
Accra Royal Estate          ← displayName (business name when present)
Kwame Mensah                ← user.name, muted, only when it differs
```

Suppress the secondary line when `displayName === user.name` (i.e. `entityName` is null) so
residential customers do not show a duplicated name. Do **not** add a separate always-visible
"Entity" column — that was explicitly rejected in design to avoid list clutter.

The raw `entityName` remains in every payload for CSV export, column customisation and filters.

## 5. "Missing business name" backlog view

```
GET /api/customer/admin/list?missingEntityName=true&page=1&limit=50
```

Returns only customers whose category requires a business name **and** whose `entityName` is
still null. Response shape is the normal paginated customer list, so an existing table
component works unchanged. Suggested placement: a saved filter chip on the Customers list,
labelled "Missing business name", with a count badge from `pagination.total`.

`search` can be combined with it — the two filters AND together, and `pagination.total`
reflects both.

## 6. Search

The existing search box now also matches business names. Update the placeholder / help text to:
*"Search by name, business name, email or phone"*. No request change — same `search` param.

## 7. Error handling

All entity-name failures are `400` with `{ "message": "…" }`:

| Message | Cause | Suggested UI |
|---|---|---|
| `Business name is required for this customer type` | Category requires it; field empty/blank, or a type switch into an entity category without a name | Inline field error, focus the input |
| `Business name is not allowed for this customer type` | A value was sent for a non-entity category | Should be unreachable if §3 is implemented — hide the field and omit the key. If it occurs, clear the field and resubmit |
| `Business name must be 150 characters or fewer` | Overlong value | Inline error; enforce `maxLength={150}` client-side to prevent it |
| `Customer type not found: <uuid>` | Stale category id in the form | Reload the category list |

Note the length rule is enforced **server-side only** (400), not by the request schema — a 422
will not fire for length. Client-side `maxLength` keeps the UX clean.

## 8. Test checklist

- [ ] Create a category with the toggle on and a custom label; verify both come back on read.
- [ ] Toggle the flag on an existing category; confirm its current customers still list fine and
      show the person's name.
- [ ] Create a customer in an entity category **without** a name → inline 400 error.
- [ ] Create the same customer **with** a name → list shows the business name as primary.
- [ ] Create a customer in a residential category → the field is absent and the request omits it.
- [ ] Edit a customer: change only the address on an entity customer with no name → succeeds.
- [ ] Switch a customer residential → entity without a name → 400; with a name → succeeds.
- [ ] Switch a customer entity → residential → confirmation shown, name cleared afterwards.
- [ ] `missingEntityName=true` returns only null-name entity customers; count badge matches.
- [ ] Search by business name finds the customer.
- [ ] Pickup queue, pickup detail and invoice Bill-To all show the business name.
