<script setup lang="ts">
import type { CustomerBin } from '~/types/customer'

/**
 * Bin-mix editor for a per_bin customer (multi-bin-sizes).
 *
 * Replaces the old single capacity + count fields with a replace-all inventory:
 * one row per { tier, quantity }. Saving calls PUT /customer/admin/:id/bins with
 * the complete array (never a delta) — the backend re-prices the active/pending
 * subscription immediately, so we show a local price preview before confirming.
 */
const props = defineProps<{
  customerId: string
  bins: CustomerBin[]
  pricingMode: 'per_bin' | 'full_truck'
  /** Pickups per billing cycle, for the cycle-price preview (weekly=4, biweekly=2, monthly=1) */
  pickupsPerCycle?: number
}>()

const emit = defineEmits<{
  (e: 'updated', bins: CustomerBin[]): void
}>()

const api = useApi()
const toast = useAppToast()

interface CapacityTier {
  id: string
  capacityLiters: number
  prepayRate: number
  postpayRate: number
  isActive: boolean
}

// Editable rows — capacityRateId + quantity, initialised from the loaded inventory
interface BinRow { capacityRateId: string; quantity: number }
const rows = ref<BinRow[]>(
  (props.bins || []).map(b => ({ capacityRateId: b.capacityRate.id, quantity: b.quantity })),
)

const tiers = ref<CapacityTier[]>([])
const loadingTiers = ref(false)
const saving = ref(false)

async function fetchTiers() {
  loadingTiers.value = true
  // Public catalogue, already filtered to active tiers. Amounts are GHS major units.
  const data = await api.get<{ tiers: CapacityTier[]; total: number }>('/rates/capacity', 'Failed to load bin tiers')
  if (data) tiers.value = data.tiers || []
  loadingTiers.value = false
}
onMounted(fetchTiers)

function tierById(id: string): CapacityTier | undefined {
  return tiers.value.find(t => t.id === id)
}

function litersLabel(id: string): string {
  const t = tierById(id)
  return t ? `${t.capacityLiters} L` : '—'
}

// A tier already used by another row must not be selectable again (duplicates 400)
function availableFor(rowIndex: number): CapacityTier[] {
  const usedElsewhere = new Set(
    rows.value.filter((_, i) => i !== rowIndex).map(r => r.capacityRateId).filter(Boolean),
  )
  const own = rows.value[rowIndex]?.capacityRateId
  return tiers.value.filter(t => t.id === own || !usedElsewhere.has(t.id))
}

function addRow() {
  const used = new Set(rows.value.map(r => r.capacityRateId))
  const next = tiers.value.find(t => !used.has(t.id))
  if (!next) {
    toast.warning('No more sizes', 'Every active tier is already in the bin mix.')
    return
  }
  rows.value.push({ capacityRateId: next.id, quantity: 1 })
}

// Keep at least one row — removing them all is invalid (min 1) and 400s via API
function removeRow(index: number) {
  if (rows.value.length <= 1) return
  rows.value.splice(index, 1)
}

// Local price preview from the tier catalogue: Σ(postpayRate × qty) per pickup
const perPickup = computed(() =>
  rows.value.reduce((sum, r) => {
    const t = tierById(r.capacityRateId)
    return sum + (t ? t.postpayRate * r.quantity : 0)
  }, 0),
)
const money = (n: number) => `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function mergedRows(): BinRow[] {
  const map = new Map<string, number>()
  for (const r of rows.value) map.set(r.capacityRateId, (map.get(r.capacityRateId) ?? 0) + r.quantity)
  return [...map.entries()].map(([capacityRateId, quantity]) => ({ capacityRateId, quantity }))
}

async function save() {
  if (saving.value) return
  const cleaned = rows.value.filter(r => r.capacityRateId && r.quantity >= 1)
  if (cleaned.length === 0) {
    toast.error('Add at least one bin size', 'A customer needs a bin inventory before they can be subscribed.')
    return
  }
  // Guard duplicates client-side too (server 400s otherwise)
  if (new Set(cleaned.map(r => r.capacityRateId)).size !== cleaned.length) {
    rows.value = mergedRows()
    toast.warning('Merged duplicate sizes', 'Two rows used the same tier — merged into one. Please save again.')
    return
  }

  saving.value = true
  const body = { bins: cleaned.map(r => ({ capacityRateId: r.capacityRateId, quantity: r.quantity })) }
  try {
    const res = await api.request<{ capacityRateId: string; capacityLiters: number; quantity: number }[]>(
      `/customer/admin/${props.customerId}/bins`,
      { method: 'PUT', body: JSON.stringify(body) },
    )
    const saved: CustomerBin[] = (res || []).map(b => ({
      quantity: b.quantity,
      capacityRate: { id: b.capacityRateId, capacityLiters: b.capacityLiters },
    }))
    toast.success('Bin sizes updated', 'The subscription has been re-priced with the new bin mix.')
    emit('updated', saved)
  } catch (err: unknown) {
    handleSaveError(err)
  } finally {
    saving.value = false
  }
}

// §6 error-to-UI matrix — the thrown message is the server's `message` field
function handleSaveError(err: unknown) {
  const m = err instanceof Error ? err.message : String(err ?? '')
  const lower = m.toLowerCase()
  if (lower.includes('duplicate')) {
    rows.value = mergedRows()
    toast.warning('Duplicate bin size', 'Rows were merged — saving again should succeed.')
  } else if (lower.includes('not found') || lower.includes('inactive')) {
    fetchTiers()
    toast.warning('A bin size is no longer available', 'The size was deactivated. The picker has been refreshed — please re-check the mix.')
  } else if (lower.includes('per-bin') || lower.includes('only valid')) {
    toast.error('Cannot edit bins', m || 'Bin mix is only valid for per-bin customer types.')
  } else if (lower.includes('not found') && props.customerId) {
    toast.error('Customer no longer exists', m)
  } else {
    toast.error('Failed to save bin sizes', m)
  }
}

const emptyInventory = computed(() => rows.value.length === 0)
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:16px">
    <!-- full_truck: the bins endpoint 400s for truck-priced customers -->
    <div
      v-if="pricingMode === 'full_truck'"
      style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;display:flex;gap:12px;align-items:flex-start"
    >
      <UIcon name="i-lucide-truck" style="width:20px;height:20px;color:#6b7280;flex-shrink:0;margin-top:2px" />
      <div>
        <p style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0 0 4px">Bin mix not applicable</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">This is a full-truck customer — pricing follows the truck load tier selected at booking, so there are no individual bins to manage.</p>
      </div>
    </div>

    <!-- per_bin editor -->
    <template v-else>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <p style="font-size:16px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">Bin Inventory</p>
          <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 0">One row per size. Saving replaces the customer's entire bin mix.</p>
        </div>
        <button
          type="button"
          :disabled="loadingTiers"
          style="height:38px;padding:0 16px;background:rgba(255,180,0,0.12);border:1px dashed #ffb400;border-radius:12px;font-size:13px;font-weight:600;color:#b45309;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px"
          @click="addRow"
        >
          <UIcon name="i-lucide-plus" style="width:14px;height:14px" />
          Add bin size
        </button>
      </div>

      <!-- Empty state warning -->
      <div
        v-if="emptyInventory"
        style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 16px;display:flex;gap:10px;align-items:flex-start"
      >
        <UIcon name="i-lucide-triangle-alert" style="width:18px;height:18px;color:#ef4444;flex-shrink:0;margin-top:1px" />
        <p style="font-size:13px;color:#991b1b;font-family:'Manrope',sans-serif;margin:0">No bins set. This customer cannot be subscribed or priced for pay-as-you-go until at least one bin size is added.</p>
      </div>

      <!-- Rows -->
      <div style="display:flex;flex-direction:column;gap:10px">
        <div
          v-for="(row, i) in rows"
          :key="i"
          style="display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px"
        >
          <select
            v-model="row.capacityRateId"
            style="height:40px;padding:0 14px;background:white;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;box-sizing:border-box"
          >
            <option value="" disabled>Select size</option>
            <option v-for="t in availableFor(i)" :key="t.id" :value="t.id">{{ t.capacityLiters }} L — {{ money(t.postpayRate) }}/pickup</option>
          </select>

          <!-- Quantity stepper (min 1) -->
          <div style="display:flex;align-items:center;gap:8px">
            <button
              type="button"
              :disabled="row.quantity <= 1"
              :style="`width:32px;height:32px;border:1px solid #e5e7eb;border-radius:8px;background:white;cursor:${row.quantity <= 1 ? 'not-allowed' : 'pointer'};font-size:16px;color:${row.quantity <= 1 ? '#d1d5db' : '#6b7280'};display:flex;align-items:center;justify-content:center`"
              @click="row.quantity = Math.max(1, row.quantity - 1)"
            >−</button>
            <span style="min-width:28px;text-align:center;font-size:15px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.quantity }}</span>
            <button
              type="button"
              style="width:32px;height:32px;border:1px solid #e5e7eb;border-radius:8px;background:white;cursor:pointer;font-size:16px;color:#6b7280;display:flex;align-items:center;justify-content:center"
              @click="row.quantity++"
            >+</button>
          </div>

          <button
            type="button"
            :disabled="rows.length <= 1"
            :title="rows.length <= 1 ? 'At least one bin size is required' : 'Remove'"
            style="width:32px;height:32px;border:none;border-radius:8px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0.6"
            @click="removeRow(i)"
          >
            <UIcon name="i-lucide-trash-2" style="width:16px;height:16px;color:#ef4444" />
          </button>
        </div>
      </div>

      <!-- Price preview -->
      <div v-if="!emptyInventory" style="display:flex;align-items:center;justify-content:space-between;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 18px">
        <p style="font-size:13px;color:#92400e;font-family:'Manrope',sans-serif;margin:0">New price per pickup ({{ rows.reduce((s, r) => s + r.quantity, 0) }} bins)</p>
        <p style="font-size:18px;font-weight:700;color:#92400e;font-family:'Manrope',sans-serif;margin:0">{{ money(perPickup) }}</p>
      </div>
      <div v-if="!emptyInventory && pickupsPerCycle" style="display:flex;align-items:center;justify-content:space-between;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-top:-6px">
        <p style="font-size:13px;color:#92400e;font-family:'Manrope',sans-serif;margin:0">New cycle price (×{{ pickupsPerCycle }} pickups)</p>
        <p style="font-size:18px;font-weight:700;color:#92400e;font-family:'Manrope',sans-serif;margin:0">{{ money(perPickup * pickupsPerCycle) }}</p>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button
          type="button"
          :disabled="saving || emptyInventory"
          :style="`height:40px;padding:0 20px;background:${saving || emptyInventory ? '#f3f4f6' : '#ffb400'};border:none;border-radius:1000px;font-size:14px;font-weight:600;color:${saving || emptyInventory ? '#9ca3af' : '#0a0d12'};font-family:'Manrope',sans-serif;cursor:${saving || emptyInventory ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px`"
          @click="save"
        >
          <UIcon v-if="saving" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
          {{ saving ? 'Saving...' : 'Save bin mix' }}
        </button>
      </div>
    </template>
  </div>
</template>
