# Admin Panel Guide: Add New Customer — Conditional Fields

This guide explains one UI change needed in the "Add New Customer" modal to support the new pricing model.

## What Changed

Customers now have two pricing modes based on their **Customer Type**:

- **`per_bin`** — priced by bin capacity × number of bins (e.g. Hospitality, Household)
- **`full_truck`** — priced by truck load tier selected at booking time (e.g. Construction, Industrial)

The form currently shows **Bin Capacity** and **Assigned BINs** for every customer. These fields are only relevant for `per_bin` customers.

---

## What to Change

| Change | Details |
|--------|---------|
| **Conditional** Bin Capacity dropdown | Show only when selected Customer Type has `pricingMode = "per_bin"` |
| **Conditional** Assigned BINs counter | Show only when selected Customer Type has `pricingMode = "per_bin"` |
| **Keep** everything else | Name, email, phone, address, zone, city, region — unchanged |

### Current form (all fields always visible)

```
┌─────────────────────────────────────────┐
│ Add New Customer                        │
├─────────────────────────────────────────┤
│ First Name    [John]                    │
│ Last Name     [Doe]                     │
│ Email         [john.doe@email.com]      │
│ Phone         [(555) 000-0000]          │
│ Customer Type [Hospitality ▼]           │
│ Bin Capacity  [Select bin capacity ▼]   │  ← always visible
│ Address       [TomTom search...]        │
│ City / Region [Accra / Greater Accra]   │
│ Zone          [Select a zone ▼]         │
│ Assigned BINs [−] 1 [+]                │  ← always visible
│                                         │
│              [Cancel]  [Add Customer]   │
└─────────────────────────────────────────┘
```

### Updated form (conditional fields)

**When Customer Type = `per_bin` (e.g. Hospitality):**

```
┌─────────────────────────────────────────┐
│ Add New Customer                        │
├─────────────────────────────────────────┤
│ First Name    [John]                    │
│ Last Name     [Doe]                     │
│ Email         [john.doe@email.com]      │
│ Phone         [(555) 000-0000]          │
│ Customer Type [Hospitality ▼]           │
│                                         │
│ ┌─ per_bin fields ────────────────────┐ │
│ │ Bin Capacity  [240L ▼]              │ │
│ │ Assigned BINs [−] 2 [+]            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Address       [TomTom search...]        │
│ City / Region [Accra / Greater Accra]   │
│ Zone          [Select a zone ▼]         │
│                                         │
│              [Cancel]  [Add Customer]   │
└─────────────────────────────────────────┘
```

**When Customer Type = `full_truck` (e.g. Construction):**

```
┌─────────────────────────────────────────┐
│ Add New Customer                        │
├─────────────────────────────────────────┤
│ First Name    [John]                    │
│ Last Name     [Doe]                     │
│ Email         [john.doe@email.com]      │
│ Phone         [(555) 000-0000]          │
│ Customer Type [Construction ▼]          │
│                                         │
│   (Bin Capacity + Assigned BINs hidden) │
│                                         │
│ Address       [TomTom search...]        │
│ City / Region [Accra / Greater Accra]   │
│ Zone          [Select a zone ▼]         │
│                                         │
│              [Cancel]  [Add Customer]   │
└─────────────────────────────────────────┘
```

---

## Frontend Logic

### Step 1: Fetch customer types with pricing mode

The customer types list endpoint already returns `pricingMode`:

```http
GET /api/customer/admin/types
Authorization: Bearer <admin-token>
```

```json
{
  "success": true,
  "data": [
    {
      "id": "type-uuid-1",
      "name": "Hospitality",
      "pricingMode": "per_bin"
    },
    {
      "id": "type-uuid-2",
      "name": "Household",
      "pricingMode": "per_bin"
    },
    {
      "id": "type-uuid-3",
      "name": "Construction",
      "pricingMode": "full_truck"
    }
  ]
}
```

### Step 2: Toggle fields on Customer Type change

```typescript
const selectedType = customerTypes.find(t => t.id === selectedTypeId);
const isPerBin = selectedType?.pricingMode !== "full_truck";

// Show/hide bin-related fields
binCapacityField.visible = isPerBin;
assignedBinsField.visible = isPerBin;

// When hiding, reset values so they aren't sent
if (!isPerBin) {
  binCapacityValue = null;
  assignedBinsValue = null;
}
```

### Step 3: Handle the `noBins` requirement

The backend requires **exactly one** of `noBins` or `estimatedQuantityId`. The form sends `noBins` via the Assigned BINs counter.

For `full_truck` customers where the counter is hidden, send a default:

```typescript
const payload = {
  email,
  name: `${firstName} ${lastName}`,
  phoneNumber,
  customerTypeId: selectedTypeId,
  zoneId: selectedZoneId,
  address,
  city,
  region,
  postalCode,
  country,
  placeName,
  location: { lat, lng },

  // Only for per_bin customers
  ...(isPerBin && {
    capacityRateId: selectedBinCapacityId,
    noBins: assignedBinsCount,
  }),

  // For full_truck: send a minimal default so the backend accepts the request
  ...(!isPerBin && {
    noBins: 1,
  }),
};
```

---

## API: Create Customer (Admin)

```http
POST /api/customer/admin
Authorization: Bearer <admin-token>
Content-Type: application/json
```

Permission required: `customers.manage`

### Request body — per_bin customer

```json
{
  "email": "john.doe@email.com",
  "name": "John Doe",
  "phoneNumber": "+233201234567",
  "customerTypeId": "type-uuid-1",
  "zoneId": "zone-uuid-1",
  "capacityRateId": "rate-uuid-240l",
  "noBins": 2,
  "address": "12 Ring Road",
  "city": "Accra",
  "region": "Greater Accra",
  "postalCode": "00233",
  "country": "Ghana",
  "placeName": "Osu",
  "location": { "lat": 5.6037, "lng": -0.187 }
}
```

### Request body — full_truck customer

```json
{
  "email": "site@construction.com",
  "name": "BuildRight Ltd",
  "phoneNumber": "+233209876543",
  "customerTypeId": "type-uuid-3",
  "zoneId": "zone-uuid-2",
  "noBins": 1,
  "address": "Hospital Road",
  "city": "Kumasi",
  "region": "Ashanti",
  "postalCode": "00233",
  "country": "Ghana",
  "placeName": "Ahodwo",
  "location": { "lat": 6.6885, "lng": -1.6244 }
}
```

> Note: `capacityRateId` is omitted for `full_truck` — pricing is determined by the truck tier chosen at booking time, not by bin capacity.

### Response `201`

```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "cust-uuid-new",
    "userId": "user-uuid-new",
    "email": "john.doe@email.com",
    "name": "John Doe",
    "phoneNumber": "+233201234567",
    "customerType": {
      "id": "type-uuid-1",
      "name": "Hospitality",
      "pricingMode": "per_bin"
    },
    "noBins": 2,
    "capacityRateId": "rate-uuid-240l",
    "zoneId": "zone-uuid-1",
    "address": "12 Ring Road",
    "city": "Accra",
    "region": "Greater Accra",
    "status": "active"
  }
}
```

---

## Error Responses

**`400` — missing both noBins and estimatedQuantityId:**

```json
{ "success": false, "message": "Provide exactly one of noBins or estimatedQuantityId" }
```

**`400` — capacity rate not found or inactive:**

```json
{ "success": false, "message": "Capacity rate not found or inactive" }
```

**`400` — customer type not found:**

```json
{ "success": false, "message": "Customer type not found: <id>" }
```

**`404` — zone not found or inactive:**

```json
{ "success": false, "message": "Zone not found or inactive: <id>" }
```

**`409` — email already exists:**

```json
{ "success": false, "message": "User with this email already exists" }
```

---

## Why This Matters

| Pricing Mode | What determines the price | Bin fields relevant? |
|---|---|---|
| `per_bin` | `capacityRate.prepayRate × customer.noBins` | **Yes** — both fields drive the price |
| `full_truck` | `truckLoadRate.prepayRate` (chosen at booking) | **No** — bins are ignored by the pricing engine |

Showing bin fields for `full_truck` customers would confuse admins into thinking those values affect pricing. Hiding them makes the form cleaner and prevents misconfiguration.

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Create customer (admin) | POST | `/api/customer/admin` |
| List customer types (for dropdown) | GET | `/api/customer/admin/types` |
| List capacity rates (for Bin Capacity dropdown) | GET | `/api/rates/capacity` |
| List zones (for Zone dropdown) | GET | `/api/zones` |
