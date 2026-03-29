---
inclusion: auto
---

# Component Patterns

## Modal Components

Standard modal structure:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: Record<string, unknown>): void
}>()

const form = reactive({ /* fields */ })
const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  // validation logic
  return Object.keys(errors).length === 0
}

function submit() {
  if (!validate()) return
  emit('submit', { /* payload */ })
}
</script>
```

Modal styling:
- Fixed overlay: `position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50`
- Container: `width:510px;max-height:90vh;background:white;border-radius:16px`
- Header: `padding:24px 24px 16px;border-bottom:1px solid #e5e7eb`
- Body: `flex:1;overflow-y:auto;padding:24px`
- Footer: `padding:17px 24px;border-top:1px solid #e5e7eb`

## Form Inputs

Standard input styling:
```typescript
function inputStyle(field: string) {
  return `width:100%;height:39px;padding:0 12px;background:white;border:1px solid ${errors[field] ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box`
}

function onFocus(e: Event, field: string) {
  if (!errors[field]) (e.target as HTMLElement).style.borderColor = '#ffb400'
}

function onBlur(e: Event, field: string) {
  if (!errors[field]) (e.target as HTMLElement).style.borderColor = '#e5e7eb'
}
```

## Select Dropdowns

Custom select styling with chevron:
```typescript
const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
```

Select style:
- `height:42px` (slightly taller than text inputs)
- `appearance:none` to remove default styling
- `background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center`

## Status Badges

Dynamic status styling:
```typescript
function statusStyle(status: string) {
  if (status === 'active') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e' }
  if (status === 'inactive') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#ef4444' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}
```

## Card Layouts

Grid layout for cards:
```vue
<div class="grid-cols-3">
  <div v-for="item in items" :key="item.id" style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <!-- card content -->
  </div>
</div>
```

## Buttons

Primary button:
```
height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)
```

Secondary button:
```
height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer
```

Hover states:
```vue
@mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
@mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
```

## Icons

Use Nuxt UI icons:
```vue
<UIcon name="i-lucide-plus" style="width:16px;height:16px;color:#111" />
```

Common icons:
- `i-lucide-plus` - Add actions
- `i-lucide-x` - Close/remove
- `i-lucide-phone` - Phone numbers
- `i-lucide-truck` - Trucks/vehicles
- `i-lucide-map-pin` - Locations/zones
- `i-lucide-package` - Pickups/bins
- `i-lucide-dollar-sign` - Money/earnings
- `i-lucide-calendar` - Dates
- `i-lucide-check-circle` - Success states
- `i-lucide-alert-circle` - Warnings/errors
