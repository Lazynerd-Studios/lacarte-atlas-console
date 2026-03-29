---
inclusion: auto
---

# Validation Patterns

## Form Validation

Standard validation function structure:

```typescript
const errors = reactive<Record<string, string>>({})

function validate() {
  // Clear previous errors
  Object.keys(errors).forEach(k => delete errors[k])
  
  // Validation logic
  if (!form.field.trim()) errors.field = 'Required'
  
  return Object.keys(errors).length === 0
}
```

## Common Validation Rules

### Required Fields
```typescript
if (!form.firstName.trim()) errors.firstName = 'Required'
if (!form.email.trim()) errors.email = 'Required'
```

### Email Validation
```typescript
if (!form.email.trim()) {
  errors.email = 'Required'
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
  errors.email = 'Invalid email'
}
```

### Phone Number Validation
```typescript
if (!form.phoneNumber.trim()) {
  errors.phoneNumber = 'Required'
} else if (!/^\+?[\d\s\-\(\)]+$/.test(form.phoneNumber)) {
  errors.phoneNumber = 'Invalid phone number'
}
```

### Date Validation
```typescript
if (!form.licenseExpiry) {
  errors.licenseExpiry = 'Required'
} else if (new Date(form.licenseExpiry) < new Date()) {
  errors.licenseExpiry = 'Date must be in the future'
}
```

### VIN Number Validation (17 characters)
```typescript
if (!form.vinNumber.trim()) {
  errors.vinNumber = 'Required'
} else if (form.vinNumber.length !== 17) {
  errors.vinNumber = 'VIN must be exactly 17 characters'
}
```

### Plate Number Pattern (LCT-####)
```typescript
if (!form.plateNumber.trim()) {
  errors.plateNumber = 'Required'
} else if (!/^LCT-\d{4,}$/.test(form.plateNumber)) {
  errors.plateNumber = 'Format: LCT-#### (e.g., LCT-1001)'
}
```

### Truck ID Pattern (T-###)
```typescript
if (!form.truckId.trim()) {
  errors.truckId = 'Required'
} else if (!/^T-\d{3,}$/.test(form.truckId)) {
  errors.truckId = 'Format: T-### (e.g., T-001)'
}
```

### Numeric Range Validation
```typescript
if (!form.capacity) {
  errors.capacity = 'Required'
} else if (form.capacity < 1 || form.capacity > 50) {
  errors.capacity = 'Capacity must be between 1 and 50 tons'
}
```

### Year Validation
```typescript
const currentYear = new Date().getFullYear()
if (!form.year) {
  errors.year = 'Required'
} else if (form.year < 1990 || form.year > currentYear + 1) {
  errors.year = `Year must be between 1990 and ${currentYear + 1}`
}
```

## Error Display

Show errors below inputs:
```vue
<input v-model="form.email" :style="inputStyle('email')" />
<span v-if="errors.email" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">
  {{ errors.email }}
</span>
```

## Submit Handler

```typescript
function submit() {
  if (!validate()) return
  
  // Transform form data if needed
  const payload = {
    email: form.email,
    name: `${form.firstName.trim()} ${form.lastName.trim()}`,
    phoneNumber: form.phoneNumber,
    // ... other fields
  }
  
  emit('submit', payload)
}
```

## API Error Handling

Display API validation errors:
```typescript
async function handleSubmit(payload: Record<string, any>) {
  const api = useApi()
  const result = await api.post('/endpoint', payload, 'Failed to create resource')
  
  if (result !== null) {
    // Success - close modal and refresh
    showModal.value = false
    await fetchData()
  } else {
    // Error is already displayed by useApi
    // Keep modal open for user to correct
  }
}
```

## Conditional Validation

Optional fields with conditional requirements:
```typescript
// Zone is optional, but if provided must be valid
if (form.zoneId && !zones.value.find(z => z.id === form.zoneId)) {
  errors.zoneId = 'Invalid zone selected'
}

// License number required only if driver is active
if (form.status === 'active' && !form.licenseNumber.trim()) {
  errors.licenseNumber = 'Required for active drivers'
}
```

## Real-time Validation

Validate on blur for better UX:
```vue
<input
  v-model="form.email"
  @blur="validateField('email')"
  :style="inputStyle('email')"
/>
```

```typescript
function validateField(field: string) {
  delete errors[field]
  
  if (field === 'email') {
    if (!form.email.trim()) {
      errors.email = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email'
    }
  }
  // ... other fields
}
```
