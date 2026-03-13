<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { format } = useCurrency()

const inventory = ref([
  { id: 1, name: 'Standard Waste Bin',           sku: 'WB-120-STD',  category: 'Bins',     stock: 45, reorder: 20, unitCost: 85  },
  { id: 2, name: 'Recycling Bin',                sku: 'RB-80-STD',   category: 'Bins',     stock: 32, reorder: 20, unitCost: 75  },
  { id: 3, name: 'Heavy Duty Bin Bags (50 pack)',sku: 'BB-50-HD',    category: 'Bin Bags', stock: 15, reorder: 20, unitCost: 22  },
  { id: 4, name: 'Eco-Friendly Bin Bags (100 pack)', sku: 'BB-100-ECO', category: 'Bin Bags', stock: 8, reorder: 15, unitCost: 35 },
  { id: 5, name: 'Bin Cleaning Brush',           sku: 'BR-001',      category: 'Brush',    stock: 67, reorder: 25, unitCost: 18  },
  { id: 6, name: 'Bin Deodorizer Soap (3 pack)', sku: 'SP-003',      category: 'Soap',     stock: 89, reorder: 30, unitCost: 12  },
  { id: 7, name: 'Large Waste Bin 240L',         sku: 'WB-240-LG',   category: 'Bins',     stock: 28, reorder: 15, unitCost: 120 },
  { id: 8, name: 'Compost Bin',                  sku: 'CB-60-STD',   category: 'Bins',     stock: 19, reorder: 10, unitCost: 65  },
  { id: 9, name: 'Bin Liner Rolls (20 pack)',    sku: 'BL-020-STD',  category: 'Bin Bags', stock: 54, reorder: 25, unitCost: 15  },
  { id: 10, name: 'Disinfectant Spray 500ml',    sku: 'DS-500',      category: 'Soap',     stock: 41, reorder: 20, unitCost: 9   },
])

const categories = computed(() => ['All Categories', ...new Set(inventory.value.map(i => i.category))])
const statuses = ['All Status', 'ok', 'low', 'critical']

const categoryFilter = ref('All Categories')
const statusFilter = ref('All Status')
const searchQuery = ref('')

function stockStatus(item: { stock: number; reorder: number }) {
  if (item.stock < item.reorder * 0.6) return 'critical'
  if (item.stock < item.reorder) return 'low'
  return 'ok'
}

const filtered = computed(() => {
  return inventory.value.filter(item => {
    const matchCat = categoryFilter.value === 'All Categories' || item.category === categoryFilter.value
    const matchStatus = statusFilter.value === 'All Status' || stockStatus(item) === statusFilter.value
    const matchSearch = !searchQuery.value || item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchCat && matchStatus && matchSearch
  })
})

const lowStockCount = computed(() => inventory.value.filter(i => stockStatus(i) !== 'ok').length)

// Update stock modal
const showUpdateModal = ref(false)
const selectedItem = ref<typeof inventory.value[0] | null>(null)
const addQty = ref(0)
const removeQty = ref(0)
const updateReason = ref('')
const updateNotes = ref('')

const previewStock = computed(() => {
  if (!selectedItem.value) return 0
  return Math.max(0, selectedItem.value.stock + (addQty.value || 0) - (removeQty.value || 0))
})

function openUpdate(item: typeof inventory.value[0]) {
  selectedItem.value = item
  addQty.value = 0
  removeQty.value = 0
  updateReason.value = ''
  updateNotes.value = ''
  showUpdateModal.value = true
}

function confirmUpdate() {
  if (!selectedItem.value) return
  const idx = inventory.value.findIndex(i => i.id === selectedItem.value!.id)
  if (idx !== -1) inventory.value[idx]!.stock = previewStock.value
  showUpdateModal.value = false
}

function statusBadgeStyle(status: string) {
  if (status === 'ok')       return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (status === 'low')      return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  return                            { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444' }
}

function stockColor(item: { stock: number; reorder: number }) {
  const s = stockStatus(item)
  if (s === 'critical') return '#ef4444'
  if (s === 'low')      return '#ffb400'
  return '#1a1a1a'
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

function exportCSV() {
  const headers = ['Product', 'SKU', 'Category', 'Current Stock', 'Reorder Point', 'Status', 'Unit Cost']
  const rows = inventory.value.map(i => [i.name, i.sku, i.category, i.stock, i.reorder, stockStatus(i), i.unitCost])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'inventory.csv'; a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between">
      <div style="display:flex;flex-direction:column;gap:6px">
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">Inventory Management</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Monitor and manage stock levels</p>
      </div>
      <button
        style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
        @click="exportCSV"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
      >
        <UIcon name="i-lucide-download" style="width:16px;height:16px;color:#111" />
        Export CSV
      </button>
    </div>

    <!-- Low stock alert -->
    <div
      v-if="lowStockCount > 0"
      style="background:white;border:1px solid #ef4444;border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1)"
    >
      <UIcon name="i-lucide-alert-circle" style="width:20px;height:20px;color:#ef4444;flex-shrink:0" />
      <div>
        <p style="font-size:14px;font-weight:500;color:#ef4444;font-family:'Manrope',sans-serif;margin:0 0 2px">Low Stock Alert</p>
        <p style="font-size:14px;color:#ef4444;font-family:'Manrope',sans-serif;margin:0">
          {{ lowStockCount }} product{{ lowStockCount > 1 ? 's are' : ' is' }} below reorder point. Consider restocking soon.
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px" class="filters-grid">
        <!-- Search -->
        <div style="position:relative">
          <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name or SKU..."
            style="width:100%;height:42px;padding:0 12px 0 38px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>

        <!-- Category filter -->
        <select
          v-model="categoryFilter"
          :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
        >
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>

        <!-- Status filter -->
        <select
          v-model="statusFilter"
          :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
        >
          <option v-for="s in statuses" :key="s" :value="s">{{ s === 'All Status' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1) }}</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="table-scroll" style="background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Product</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">SKU</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Category</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Current Stock</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Reorder Point</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Unit Cost</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filtered"
            :key="item.id"
            style="border-bottom:1px solid #e5e7eb"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ item.name }}</td>
            <td style="padding:18px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ item.sku }}</td>
            <td style="padding:18px 16px">
              <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:#6b7280;background:#e5e7eb;border:1px solid #e5e7eb">
                {{ item.category }}
              </span>
            </td>
            <td style="padding:18px 16px;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;white-space:nowrap" :style="`color:${stockColor(item)}`">
              {{ item.stock }}
            </td>
            <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ item.reorder }}</td>
            <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ format(item.unitCost) }}</td>
            <td style="padding:18px 16px">
              <span
                :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;
                  color:${statusBadgeStyle(stockStatus(item)).color};
                  background:${statusBadgeStyle(stockStatus(item)).bg};
                  border:1px solid ${statusBadgeStyle(stockStatus(item)).border}`"
              >{{ stockStatus(item) }}</span>
            </td>
            <td style="padding:18px 16px;text-align:right">
              <button
                style="height:32px;padding:0 14px;background:#ececec;border:none;border-radius:20px;font-size:13px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap"
                @click="openUpdate(item)"
                @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
              >Update Stock</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="8" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No items match your filters</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

  <!-- Update Stock Modal -->
  <div
    v-if="showUpdateModal && selectedItem"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="showUpdateModal = false"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative">

      <!-- Header -->
      <div style="padding:24px 24px 16px;border-bottom:1px solid #e5e7eb">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">Update Stock</p>
      </div>
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="showUpdateModal = false"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Body -->
      <div style="padding:24px;display:flex;flex-direction:column;gap:16px">

        <!-- Product info -->
        <div style="display:flex;flex-direction:column;gap:4px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Product</p>
          <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ selectedItem.name }}</p>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">SKU: {{ selectedItem.sku }}</p>
        </div>

        <!-- Current stock -->
        <div style="display:flex;flex-direction:column;gap:4px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Current Stock</p>
          <p style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">{{ selectedItem.stock }}</p>
        </div>

        <!-- Add / Remove -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Add Stock</label>
            <input
              v-model.number="addQty"
              type="number"
              min="0"
              placeholder="0"
              style="width:100%;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
            />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Remove Stock</label>
            <input
              v-model.number="removeQty"
              type="number"
              min="0"
              placeholder="0"
              style="width:100%;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
            />
          </div>
        </div>

        <!-- New stock preview -->
        <div style="display:flex;align-items:center;gap:10px;background:#f8f9fa;border-radius:12px;padding:10px 14px">
          <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">New stock:</span>
          <span style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ previewStock }}</span>
          <span
            :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;
              color:${statusBadgeStyle(stockStatus({ stock: previewStock, reorder: selectedItem.reorder })).color};
              background:${statusBadgeStyle(stockStatus({ stock: previewStock, reorder: selectedItem.reorder })).bg};
              border:1px solid ${statusBadgeStyle(stockStatus({ stock: previewStock, reorder: selectedItem.reorder })).border}`"
          >{{ stockStatus({ stock: previewStock, reorder: selectedItem.reorder }) }}</span>
        </div>

        <!-- Reason -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Reason</label>
          <select
            v-model="updateReason"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          >
            <option value="">Select a reason...</option>
            <option value="restock">Restock / Purchase</option>
            <option value="return">Customer Return</option>
            <option value="damaged">Damaged / Write-off</option>
            <option value="audit">Stock Audit Correction</option>
            <option value="transfer">Transfer</option>
            <option value="other">Other</option>
          </select>
        </div>

        <!-- Notes -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Notes</label>
          <textarea
            v-model="updateNotes"
            placeholder="Optional notes about this stock update..."
            rows="3"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.6"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="showUpdateModal = false"
        >Cancel</button>
        <button
          style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @click="confirmUpdate"
        >Update Stock</button>
      </div>
    </div>
  </div>
</template>
