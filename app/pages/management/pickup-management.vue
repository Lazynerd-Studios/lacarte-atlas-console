<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface DisposableType {
  id: string
  name: string
  description: string
  icon: string
  isActive: boolean
  displayOrder: number
  createdAt: string
}

interface EstimatedQuantity {
  id: string
  label: string
  description: string
  displayOrder: number
  isActive: boolean
  createdAt: string
}

const api = useApi()
const activeTab = ref<'disposable' | 'quantity'>('disposable')
const loading = ref(true)
const toast = useAppToast()

// Disposable Types
const disposableTypes = ref<DisposableType[]>([])
const searchDisposable = ref('')

async function fetchDisposableTypes() {
  const data = await api.get<any>('/disposable/item-types')
  if (data) {
    const items = Array.isArray(data) ? data : (data.data ?? data.disposableTypes ?? [])
    // Convert numeric isActive (0/1) to boolean for UI
    disposableTypes.value = items.map((item: any) => ({
      ...item,
      isActive: !!item.isActive
    }))
  }
}

const filteredDisposable = computed(() => 
  disposableTypes.value.filter(d => 
    !searchDisposable.value || 
    d.name.toLowerCase().includes(searchDisposable.value.toLowerCase())
  )
)

// Estimated Quantities
const estimatedQuantities = ref<EstimatedQuantity[]>([])
const searchQuantity = ref('')

async function fetchEstimatedQuantities() {
  const data = await api.get<any>('/disposable/quantities')
  if (data) {
    const items = Array.isArray(data) ? data : (data.data ?? data.quantities ?? [])
    // Convert numeric isActive (0/1) to boolean for UI
    estimatedQuantities.value = items.map((item: any) => ({
      ...item,
      isActive: !!item.isActive
    }))
  }
}

const filteredQuantity = computed(() => 
  estimatedQuantities.value.filter(q => 
    !searchQuantity.value || 
    q.label.toLowerCase().includes(searchQuantity.value.toLowerCase())
  )
)

onMounted(async () => {
  loading.value = true
  await Promise.all([
    fetchDisposableTypes(),
    fetchEstimatedQuantities()
  ])
  loading.value = false
})

// Add Disposable Type Modal
const showAddDisposableModal = ref(false)

async function handleAddDisposable(data: { name: string; description: string; icon: string; isActive: boolean; displayOrder: number }) {
  const result = await api.post('/disposable/item-types', data, 'Failed to create disposable type')
  if (result !== null) {
    showAddDisposableModal.value = false
    await fetchDisposableTypes()
    toast.success('Disposable type created successfully')
  }
}

// Edit Disposable Type Modal
const showEditDisposableModal = ref(false)
const editDisposableTarget = ref<DisposableType | null>(null)

function openEditDisposable(item: DisposableType) {
  editDisposableTarget.value = item
  showEditDisposableModal.value = true
}

async function handleEditDisposable(data: { name: string; description: string; icon: string; isActive: boolean; displayOrder: number }) {
  if (!editDisposableTarget.value) return
  const result = await api.patch(`/disposable/item-types/${editDisposableTarget.value.id}`, data, 'Failed to update disposable type')
  if (result !== null) {
    showEditDisposableModal.value = false
    editDisposableTarget.value = null
    await fetchDisposableTypes()
    toast.success('Disposable type updated successfully')
  }
}

// Delete Disposable Type Modal
const showDeleteDisposableModal = ref(false)
const deleteDisposableTarget = ref<DisposableType | null>(null)

function openDeleteDisposable(item: DisposableType) {
  deleteDisposableTarget.value = item
  showDeleteDisposableModal.value = true
}

async function handleDeleteDisposable() {
  if (!deleteDisposableTarget.value) return
  const result = await api.del(`/disposable/item-types/${deleteDisposableTarget.value.id}`, 'Failed to delete disposable type')
  if (result !== null) {
    showDeleteDisposableModal.value = false
    deleteDisposableTarget.value = null
    await fetchDisposableTypes()
    toast.success('Disposable type deleted successfully')
  }
}

// Add Estimated Quantity Modal
const showAddQuantityModal = ref(false)

async function handleAddQuantity(data: { label: string; description: string; displayOrder: number; isActive: boolean }) {
  const result = await api.post('/disposable/quantities', data, 'Failed to create estimated quantity')
  if (result !== null) {
    showAddQuantityModal.value = false
    await fetchEstimatedQuantities()
    toast.success('Estimated quantity created successfully')
  }
}

// Edit Estimated Quantity Modal
const showEditQuantityModal = ref(false)
const editQuantityTarget = ref<EstimatedQuantity | null>(null)

function openEditQuantity(item: EstimatedQuantity) {
  editQuantityTarget.value = item
  showEditQuantityModal.value = true
}

async function handleEditQuantity(data: { label: string; description: string; displayOrder: number; isActive: boolean }) {
  if (!editQuantityTarget.value) return
  const result = await api.patch(`/disposable/quantities/${editQuantityTarget.value.id}`, data, 'Failed to update estimated quantity')
  if (result !== null) {
    showEditQuantityModal.value = false
    editQuantityTarget.value = null
    await fetchEstimatedQuantities()
    toast.success('Estimated quantity updated successfully')
  }
}

// Delete Estimated Quantity Modal
const showDeleteQuantityModal = ref(false)
const deleteQuantityTarget = ref<EstimatedQuantity | null>(null)

function openDeleteQuantity(item: EstimatedQuantity) {
  deleteQuantityTarget.value = item
  showDeleteQuantityModal.value = true
}

async function handleDeleteQuantity() {
  if (!deleteQuantityTarget.value) return
  const result = await api.del(`/disposable/quantities/${deleteQuantityTarget.value.id}`, 'Failed to delete estimated quantity')
  if (result !== null) {
    showDeleteQuantityModal.value = false
    deleteQuantityTarget.value = null
    await fetchEstimatedQuantities()
    toast.success('Estimated quantity deleted successfully')
  }
}
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="loading" style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">
    <!-- Header skeleton -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="skeleton" style="height:28px;width:220px" />
        <div class="skeleton" style="height:14px;width:320px" />
      </div>
      <div class="skeleton" style="height:40px;width:200px;border-radius:10px" />
    </div>

    <!-- Tabs skeleton -->
    <div style="display:flex;gap:4px;background:#f3f4f6;border-radius:12px;padding:4px;width:fit-content">
      <div class="skeleton" style="height:36px;width:160px;border-radius:9px" />
      <div class="skeleton" style="height:36px;width:180px;border-radius:9px" />
    </div>

    <!-- Search skeleton -->
    <div class="skeleton" style="height:38px;width:320px;border-radius:10px" />

    <!-- Table skeleton -->
    <div style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden">
      <!-- Header row -->
      <div style="background:#f9fafb;border-bottom:1px solid #f0f0f0;padding:16px 24px;display:flex;gap:24px">
        <div class="skeleton" style="height:12px;width:60px" />
        <div class="skeleton" style="height:12px;width:100px" />
        <div class="skeleton" style="height:12px;flex:1" />
        <div class="skeleton" style="height:12px;width:60px" />
        <div class="skeleton" style="height:12px;width:80px" />
        <div class="skeleton" style="height:12px;width:120px" />
      </div>
      <!-- Data rows -->
      <div v-for="i in 5" :key="i" style="padding:16px 24px;display:flex;gap:24px;align-items:center;border-bottom:1px solid #f0f0f0">
        <div class="skeleton" style="width:36px;height:36px;border-radius:10px" />
        <div class="skeleton" style="height:14px;width:120px" />
        <div class="skeleton" style="height:14px;flex:1" />
        <div class="skeleton" style="height:14px;width:40px" />
        <div class="skeleton" style="height:20px;width:70px;border-radius:20px" />
        <div style="display:flex;gap:8px">
          <div class="skeleton" style="height:28px;width:60px;border-radius:8px" />
          <div class="skeleton" style="height:28px;width:70px;border-radius:8px" />
        </div>
      </div>
    </div>
  </div>

  <div v-else style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">
    
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0;line-height:1.3">Pickup Management</h1>
        <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Manage disposable types and estimated quantities</p>
      </div>
      <button 
        @click="activeTab === 'disposable' ? showAddDisposableModal = true : showAddQuantityModal = true" 
        style="display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
        <Icon name="lucide:plus" style="width:16px;height:16px" />
        {{ activeTab === 'disposable' ? 'Add Disposable Type' : 'Add Estimated Quantity' }}
      </button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:4px;background:#f3f4f6;border-radius:12px;padding:4px;width:fit-content">
      <button 
        @click="activeTab = 'disposable'"
        :style="`padding:8px 24px;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab === 'disposable' ? 'background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,0.1)' : 'background:transparent;color:#6b7280'}`">
        Disposable Types
      </button>
      <button 
        @click="activeTab = 'quantity'"
        :style="`padding:8px 24px;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab === 'quantity' ? 'background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,0.1)' : 'background:transparent;color:#6b7280'}`">
        Estimated Quantities
      </button>
    </div>

    <!-- Disposable Types Tab -->
    <div v-if="activeTab === 'disposable'" style="display:flex;flex-direction:column;gap:24px">
      
      <!-- Search -->
      <div style="position:relative;max-width:320px">
        <Icon name="lucide:search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9ca3af;pointer-events:none" />
        <input v-model="searchDisposable" placeholder="Search disposable types..." style="width:100%;height:38px;padding:0 14px 0 36px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
      </div>

      <!-- Table -->
      <div style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9fafb;border-bottom:1px solid #f0f0f0">
              <th style="text-align:left;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Icon</th>
              <th style="text-align:left;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Name</th>
              <th style="text-align:left;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Description</th>
              <th style="text-align:center;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Order</th>
              <th style="text-align:center;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Status</th>
              <th style="text-align:right;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredDisposable" :key="item.id" style="border-bottom:1px solid #f0f0f0">
              <td style="padding:16px 24px">
                <div style="width:36px;height:36px;border-radius:10px;background:#f9fafb;display:flex;align-items:center;justify-content:center">
                  <Icon :name="item.icon" style="width:18px;height:18px;color:#6b7280" />
                </div>
              </td>
              <td style="padding:16px 24px;font-size:14px;font-weight:600;color:#1a1a1a">{{ item.name }}</td>
              <td style="padding:16px 24px;font-size:13px;color:#6b7280">{{ item.description }}</td>
              <td style="padding:16px 24px;text-align:center;font-size:13px;font-weight:600;color:#1a1a1a">{{ item.displayOrder }}</td>
              <td style="padding:16px 24px;text-align:center">
                <span :style="`font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;${item.isActive ? 'background:#dcfce7;color:#16a34a' : 'background:#f3f4f6;color:#9ca3af'}`">
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td style="padding:16px 24px;text-align:right">
                <div style="display:flex;gap:8px;justify-content:flex-end">
                  <button @click="openEditDisposable(item)" style="display:flex;align-items:center;gap:6px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
                    <Icon name="lucide:pencil" style="width:12px;height:12px" />
                    Edit
                  </button>
                  <button @click="openDeleteDisposable(item)" style="display:flex;align-items:center;gap:6px;background:#fef2f2;color:#ef4444;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
                    <Icon name="lucide:trash-2" style="width:12px;height:12px" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Empty state -->
        <div v-if="filteredDisposable.length === 0" style="padding:60px 24px;text-align:center">
          <Icon name="lucide:package" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
          <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 6px">No disposable types found</p>
          <p style="font-size:13px;color:#6b7280;margin:0">Create your first disposable type to get started.</p>
        </div>
      </div>
    </div>

    <!-- Estimated Quantities Tab -->
    <div v-if="activeTab === 'quantity'" style="display:flex;flex-direction:column;gap:24px">
      
      <!-- Search -->
      <div style="position:relative;max-width:320px">
        <Icon name="lucide:search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9ca3af;pointer-events:none" />
        <input v-model="searchQuantity" placeholder="Search estimated quantities..." style="width:100%;height:38px;padding:0 14px 0 36px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
      </div>

      <!-- Table -->
      <div style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9fafb;border-bottom:1px solid #f0f0f0">
              <th style="text-align:left;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Label</th>
              <th style="text-align:left;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Description</th>
              <th style="text-align:center;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Order</th>
              <th style="text-align:center;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Status</th>
              <th style="text-align:right;padding:16px 24px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredQuantity" :key="item.id" style="border-bottom:1px solid #f0f0f0">
              <td style="padding:16px 24px;font-size:14px;font-weight:600;color:#1a1a1a">{{ item.label }}</td>
              <td style="padding:16px 24px;font-size:13px;color:#6b7280">{{ item.description }}</td>
              <td style="padding:16px 24px;text-align:center;font-size:13px;font-weight:600;color:#1a1a1a">{{ item.displayOrder }}</td>
              <td style="padding:16px 24px;text-align:center">
                <span :style="`font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;${item.isActive ? 'background:#dcfce7;color:#16a34a' : 'background:#f3f4f6;color:#9ca3af'}`">
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td style="padding:16px 24px;text-align:right">
                <div style="display:flex;gap:8px;justify-content:flex-end">
                  <button @click="openEditQuantity(item)" style="display:flex;align-items:center;gap:6px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
                    <Icon name="lucide:pencil" style="width:12px;height:12px" />
                    Edit
                  </button>
                  <button @click="openDeleteQuantity(item)" style="display:flex;align-items:center;gap:6px;background:#fef2f2;color:#ef4444;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
                    <Icon name="lucide:trash-2" style="width:12px;height:12px" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Empty state -->
        <div v-if="filteredQuantity.length === 0" style="padding:60px 24px;text-align:center">
          <Icon name="lucide:ruler" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
          <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 6px">No estimated quantities found</p>
          <p style="font-size:13px;color:#6b7280;margin:0">Create your first estimated quantity to get started.</p>
        </div>
      </div>
    </div>

    <!-- Modals for Disposable Types -->
    <AddDisposableTypeModal v-if="showAddDisposableModal" @close="showAddDisposableModal = false" @submit="handleAddDisposable" />
    <EditDisposableTypeModal v-if="showEditDisposableModal && editDisposableTarget" :item="editDisposableTarget" @close="showEditDisposableModal = false" @submit="handleEditDisposable" />
    <DeleteConfirmModal 
      v-if="showDeleteDisposableModal && deleteDisposableTarget"
      :title="`Delete ${deleteDisposableTarget.name}?`"
      message="This action cannot be undone. Are you sure you want to delete this disposable type?"
      @close="showDeleteDisposableModal = false; deleteDisposableTarget = null"
      @confirm="handleDeleteDisposable"
    />

    <!-- Modals for Estimated Quantities -->
    <AddEstimatedQuantityModal v-if="showAddQuantityModal" @close="showAddQuantityModal = false" @submit="handleAddQuantity" />
    <EditEstimatedQuantityModal v-if="showEditQuantityModal && editQuantityTarget" :item="editQuantityTarget" @close="showEditQuantityModal = false" @submit="handleEditQuantity" />
    <DeleteConfirmModal 
      v-if="showDeleteQuantityModal && deleteQuantityTarget"
      :title="`Delete ${deleteQuantityTarget.label}?`"
      message="This action cannot be undone. Are you sure you want to delete this estimated quantity?"
      @close="showDeleteQuantityModal = false; deleteQuantityTarget = null"
      @confirm="handleDeleteQuantity"
    />

  </div>
</template>
