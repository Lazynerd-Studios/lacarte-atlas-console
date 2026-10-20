# Frontend (Web Admin) — Customer Bulk Import

Bulk-create customers from an Excel sheet, with a **review-before-commit** flow. All endpoints are
under `/api/customer/admin/import*` and require the **`customers.create`** permission.

Companion docs: `frontend-web-customer-pricing-mode.md` (customer types & `pricingMode`),
`frontend-web-customer-multi-bin-sizes.md` (adding bins after import).

## The flow

```
1. Download template   GET  /api/customer/admin/import/template     → .xlsx (dropdowns)
2. Admin fills it in    (customer type & zone are dropdowns)
3. Validate (dry-run)   POST /api/customer/admin/import/validate     → per-row preview, creates NOTHING
4. Show preview         green = ready, red = fix these fields, grey = duplicate
5. Commit               POST /api/customer/admin/import              → creates valid rows, returns summary
6. After import         add bins for per_bin customers (see multi-bin doc)
```

Steps 3 and 5 take the **same upload** — the frontend **re-uploads the (corrected) file** to commit.
The server does not cache the sheet between calls, and it **re-validates on commit** (never trusts the
preview), so a value that changed server-side between the two calls is caught.

## 1. Template download
```
GET /api/customer/admin/import/template
→ 200  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
       Content-Disposition: attachment; filename="customer-import-template.xlsx"
```
- Visible **`Customers`** sheet: header row + one example row.
- `customer_type` and `zone` columns have **dropdowns** listing current types / active zones.
- A **hidden `_refs`** sheet embeds each option's `Id | Name` (the dropdowns show names).
- `email` and `phone_number` columns are text-formatted (so `+`/leading zeros survive).
- Generated per request → always reflects the current types/zones. Just trigger a browser download.

## 2. Columns

| Column | Required | Notes |
|---|---|---|
| `email` | ✅ | Login identity; must be unique (duplicates are skipped) |
| `full_name` | ✅ | Single name field → stored as the account holder's name |
| `phone_number` | ✅ | e.g. `+233…` |
| `customer_type` | ✅ | Dropdown **name** (a pasted UUID also works) |
| `zone` | ✅ | Dropdown **name** of an **active** zone (UUID also works) |
| `business_name` | conditional | Required **only** when the chosen type has `requiresEntityName = true`; must be **empty** otherwise |
| `address`, `city`, `region`, `postal_code`, `country`, `place_name` | optional | Free text |
| `latitude` + `longitude` | optional | Both or neither; numeric; must fall within Ghana |
| `external_ref` | optional | Your own reference — echoed in reports, **not stored** |

Hard limit: **100 data rows** per upload (larger files are rejected with `400`).

## 3. Validate (dry-run) — read-only preview
```
POST /api/customer/admin/import/validate      (multipart form-data, field name: "file")
→ 200
```
```jsonc
{
  "total": 3, "valid": 1, "invalid": 2, "duplicate": 0,
  "rows": [
    {
      "row": 2,                      // 1-based spreadsheet row (header = row 1)
      "status": "valid",             // "valid" | "invalid" | "duplicate"
      "email": "jane@example.com",
      "fullName": "Jane Doe",
      "businessName": null,
      "customerType": { "id": "…", "name": "Estate" },   // resolved, null if unknown
      "zone": { "id": "…", "name": "East Legon" },        // resolved, null if unknown/inactive
      "pricingMode": "full_truck",                        // helps you flag "will need bins"
      "issues": []                                        // [{ field, message }] when invalid
    },
    {
      "row": 3, "status": "invalid", "email": "bad@example.com", "fullName": "…",
      "customerType": { "id": "…", "name": "Estate" }, "zone": null, "pricingMode": null,
      "issues": [ { "field": "zone", "message": "Unknown or inactive zone \"Nowhere\"" } ]
    }
  ]
}
```
**This creates nothing** — no users, no customers, no emails. Use `rows` to render a preview table:
green (`valid`), red (`invalid`, show each `issues[].message` against its `field`), grey (`duplicate`).

## 4. Commit — create the customers
```
POST /api/customer/admin/import               (multipart form-data, field name: "file")
→ 200
```
```jsonc
{
  "total": 3, "created": 1, "skipped": 2, "failed": 0, "needsBins": 1,
  "errors": [ { "row": 5, "email": "x@y.com", "issues": [ { "field": "email", "message": "…" } ] } ]
}
```
- `created` — accounts created (each gets a **temp password emailed immediately** + auto-verified user).
- `skipped` — duplicate emails (already in the DB, or repeated in the file).
- `failed` — rows that didn't pass re-validation, or a create error; `errors[].issues` is the same
  field-level shape as the preview, so you can reuse the renderer.
- `needsBins` — count of created **`per_bin`** customers who still need bins before they can be priced
  or subscribed. Surface a CTA to the bin editor (see the multi-bin doc).

## 5. Error handling

| Status | Cause | UI |
|---|---|---|
| `422` | File fails validation (wrong/unknown type, > 1 MB) | "Upload a valid .xlsx under 1 MB" |
| `400` | > 100 data rows, or an unreadable workbook | Show the message; ask to split/fix the file |
| `401 / 403` | Not signed in / lacks `customers.create` | Route to login / forbidden |
| `200` with `failed > 0` | Per-row problems | Render `errors` (row + field + message); allow fix + re-upload |

Note: a malformed file is usually caught by upload validation (`422`); a well-formed but unreadable
workbook reaches the handler and returns `400`. Treat any 4xx as "rejected, nothing created".

## 6. Implementation notes
- Send the file as `multipart/form-data` with the field name **`file`** (a single `.xlsx`).
- Resolution is against **live** DB data; the IDs embedded in the template are a convenience only, so
  a stale sheet still resolves by name (or fails clearly if a type/zone was renamed/removed).
- Because commit re-validates, you can let the admin edit the sheet after preview and re-upload; you
  don't have to gate the commit button on a prior successful validate (though that's good UX).
- Imported `per_bin` customers have **no bins** until set — they can't subscribe or be priced for PAYG
  until an admin adds bins (`PUT /api/customer/admin/:id/bins`).

## 7. Test checklist
- Download template → opens in Excel with working type/zone dropdowns; example row present.
- Validate a mixed sheet → counts + per-row statuses correct; **no** customers/users created.
- Commit the corrected sheet → `created` matches; those users can sign in with the emailed temp password.
- Duplicate email (existing + in-file) → `skipped`, not `failed`.
- Entity type row without `business_name` → `invalid` with a `business_name` issue.
- > 100 rows → `400`; non-Excel/oversized file → `422`.
- `needsBins` reflects only `per_bin` creations; CTA leads to the bin editor.
