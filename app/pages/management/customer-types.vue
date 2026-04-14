<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface CustomerType {
  id: string  // UUID from API
  name: string
  description: string  // Client-side only
  color: string  // Client-side only
  customerCount: number  // Client-side only
}

interface ApiCustomerType {
  id: string
  name: string
  customerCount?: number
  createdAt: string
  updatedAt: string
}

const customerTypes = ref<CustomerType[]>([])
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)

// Fetch customer types from API
async function fetchCustomerTypes() {
  loading.value = true
  const api = useApi()
  
  console.log('[CustomerTypes] Fetching from /customer/admin/types')
  const response = await api.get<ApiCustomerType[]>(
    '/customer/admin/types',
    'Failed to load customer types'
  )
  
  if (response) {
    console.log('[CustomerTypes] Received:', response)
    // Transform API response to include client-side fields
    customerTypes.value = response.map((ct, index) => ({
      id: ct.id,
      name: ct.name,
      description: '',  // Not in API
      color: getColorForIndex(index),  // Assign colors cyclically
      customerCount: ct.customerCount ?? 0,  // Use API value if available
    }))
  }
  
  loading.value = false
}

// Helper to assign colors cyclically
function getColorForIndex(index: number): string {
  const colors = ['#6b7280','#3b82f6','#8b5cf6','#f97316','#22c55e','#ef4444','#ffb400','#ec4899','#14b8a6']
  return colors[index % colors.length]!
}

// Add modal
const showAddModal = ref(false)
const addForm = ref({ name: '', description: '', color: '#ffb400' })
const addError = ref('')

function openAdd() {
  addForm.value = { name: '', description: '', color: '#ffb400' }
  addError.value = ''
  showAddModal.value = true
}

async function handleAdd() {
  if (!addForm.value.name.trim()) { 
    addError.value = 'Name is required.'
    return 
  }
  
  submitting.value = true
  addError.value = ''
  
  try {
    const api = useApi()
    const toast = useAppToast()
    
    console.log('[CustomerTypes] Creating customer type:', addForm.value.name)
    
    const response = await api.post<ApiCustomerType>(
      '/customer/admin/types',
      { name: addForm.value.name.trim() },
      'Failed to create customer type'
    )
    
    if (response) {
      console.log('[CustomerTypes] Created successfully:', response)
      toast.success('Customer type created successfully')
      showAddModal.value = false
      await fetchCustomerTypes()
    }
  } catch (err: any) {
    console.error('[CustomerTypes] Failed to create:', err)
    const errorMessage = err?.message || 'Failed to create customer type'
    
    if (errorMessage.toLowerCase().includes('already exists') || 
        errorMessage.toLowerCase().includes('duplicate')) {
      addError.value = 'A customer type with this name already exists'
    } else {
      addError.value = errorMessage
    }
  } finally {
    submitting.value = false
  }
}

const showEditModal = ref(false)
const editForm = ref<CustomerType>({ id: '', name: '', description: '', color: '#ffb400', customerCount: 0 })
const editError = ref('')

function openEdit(ct: CustomerType) {
  editForm.value = { ...ct }
  editError.value = ''
  showEditModal.value = true
}

async function handleEdit() {
  if (!editForm.value.name.trim()) { 
    editError.value = 'Name is required.'
    return 
  }
  
  submitting.value = true
  editError.value = ''
  
  try {
    const api = useApi()
    const toast = useAppToast()
    
    console.log('[CustomerTypes] Updating customer type:', editForm.value.id)
    
    const response = await api.patch<ApiCustomerType>(
      `/customer/admin/types/${editForm.value.id}`,
      { name: editForm.value.name.trim() },
      'Failed to update customer type'
    )
    
    if (response) {
      console.log('[CustomerTypes] Updated successfully:', response)
      toast.success('Customer type updated successfully')
      showEditModal.value = false
      await fetchCustomerTypes()
    }
  } catch (err: any) {
    console.error('[CustomerTypes] Failed to update:', err)
    const errorMessage = err?.message || 'Failed to update customer type'
    
    if (errorMessage.toLowerCase().includes('already exists') || 
        errorMessage.toLowerCase().includes('duplicate')) {
      editError.value = 'A customer type with this name already exists'
    } else {
      editError.value = errorMessage
    }
  } finally {
    submitting.value = false
  }
}

// Delete modal
const showDeleteModal = ref(false)
const deleteTarget = ref<CustomerType | null>(null)

function openDelete(ct: CustomerType) {
  deleteTarget.value = ct
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  
  deleting.value = true
  const api = useApi()
  const toast = useAppToast()
  
  console.log('[CustomerTypes] Deleting customer type:', deleteTarget.value.id)
  
  const result = await api.del(
    `/customer/admin/types/${deleteTarget.value.id}`,
    'Failed to delete customer type'
  )
  
  if (result !== null) {
    console.log('[CustomerTypes] Deleted successfully')
    toast.success('Customer type deleted successfully')
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchCustomerTypes()
  }
  
  deleting.value = false
}

const colorOptions = ['#6b7280','#3b82f6','#8b5cf6','#f97316','#22c55e','#ef4444','#ffb400','#ec4899','#14b8a6']

// Fetch data on mount
onMounted(fetchCustomerTypes)
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 8px;
}
</style>

<template>
  <div style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">

    <!-- Loading skeleton -->
    <div v-if="loading && customerTypes.length === 0" style="display:flex;flex-direction:column;gap:32px">
      <!-- Header skeleton -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="skeleton" style="height:28px;width:200px;margin-bottom:6px" />
          <div class="skeleton" style="height:14px;width:280px" />
        </div>
        <div class="skeleton" style="height:40px;width:180px;border-radius:10px" />
      </div>

      <!-- Stats row skeleton -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px">
        <div v-for="i in 4" :key="i" style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <div class="skeleton" style="width:10px;height:10px;border-radius:50%" />
            <div class="skeleton" style="height:12px;width:80px" />
          </div>
          <div class="skeleton" style="height:28px;width:60px;margin-bottom:4px" />
          <div class="skeleton" style="height:11px;width:70px" />
        </div>
      </div>

      <!-- Types list skeleton -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div v-for="i in 3" :key="i" style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <!-- Left -->
          <div style="display:flex;align-items:flex-start;gap:16px;flex:1;min-width:200px">
            <div class="skeleton" style="width:44px;height:44px;border-radius:12px" />
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
                <div class="skeleton" style="height:16px;width:140px" />
                <div class="skeleton" style="height:20px;width:100px;border-radius:20px" />
              </div>
              <div class="skeleton" style="height:13px;width:70%;max-width:320px" />
            </div>
          </div>
          <!-- Right -->
          <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
            <div class="skeleton" style="height:36px;width:70px;border-radius:8px" />
            <div class="skeleton" style="height:36px;width:80px;border-radius:8px" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <template v-else>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0;line-height:1.3">Customer Types</h1>
        <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Manage customer type classifications</p>
      </div>
      <button @click="openAdd" :disabled="submitting || deleting" 
        :style="`display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
        <Icon name="lucide:plus" style="width:16px;height:16px" />
        Add Customer Type
      </button>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px">
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Total Types</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ customerTypes.length }}</p>
      </div>
      <div v-for="ct in customerTypes" :key="ct.id" style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span :style="`width:10px;height:10px;border-radius:50%;background:${ct.color};display:inline-block`"></span>
          <p style="font-size:12px;color:#6b7280;margin:0;font-weight:500">{{ ct.name }}</p>
        </div>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ ct.customerCount }}</p>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">customers</p>
      </div>
    </div>

    <!-- Types list -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div v-for="ct in customerTypes" :key="ct.id"
        style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">

        <!-- Left: badge + info -->
        <div style="display:flex;align-items:flex-start;gap:16px;flex:1;min-width:200px">
          <div :style="`width:44px;height:44px;border-radius:12px;background:${ct.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0`">
            <span :style="`width:16px;height:16px;border-radius:50%;background:${ct.color};display:inline-block`"></span>
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
              <span style="font-size:16px;font-weight:700;color:#1a1a1a">{{ ct.name }}</span>
              <span :style="`background:${ct.color}22;color:${ct.color};font-size:11px;font-weight:600;padding:2px 10px;border-radius:20px`">{{ ct.customerCount }} customers</span>
            </div>
            <p style="font-size:13px;color:#6b7280;margin:0;max-width:480px">{{ ct.description }}</p>
          </div>
        </div>

        <!-- Right: actions -->
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
          <button @click="openEdit(ct)" :disabled="submitting || deleting" 
            :style="`display:flex;align-items:center;gap:6px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
            <Icon name="lucide:pencil" style="width:14px;height:14px" />
            Edit
          </button>
          <button @click="openDelete(ct)" :disabled="ct.customerCount > 0 || submitting || deleting" 
            :style="`display:flex;align-items:center;gap:6px;background:${ct.customerCount > 0 || submitting || deleting ? '#f5f5f5' : '#fef2f2'};color:${ct.customerCount > 0 || submitting || deleting ? '#9ca3af' : '#ef4444'};border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${ct.customerCount > 0 || submitting || deleting ? 'not-allowed' : 'pointer'}`">
            <Icon name="lucide:trash-2" style="width:14px;height:14px" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="customerTypes.length === 0" style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:60px 24px;text-align:center">
      <Icon name="lucide:tag" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
      <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 6px">No customer types yet</p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 20px">Add your first customer type to get started.</p>
      <button @click="openAdd" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Add Customer Type</button>
    </div>

    <!-- ── ADD MODAL ── -->
    <div v-if="showAddModal" @click.self="showAddModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Add Customer Type</h2>
          <button @click="showAddModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div v-if="addError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ addError }}</div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Name <span style="color:#ef4444">*</span></label>
            <input v-model="addForm.name" placeholder="e.g. Commercial" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
            <textarea v-model="addForm.description" rows="2" placeholder="Brief description of this customer type..." style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Badge Color</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button v-for="c in colorOptions" :key="c" @click="addForm.color=c"
                :style="`width:28px;height:28px;border-radius:50%;background:${c};border:${addForm.color===c ? '3px solid #1a1a1a' : '2px solid transparent'};cursor:pointer;outline:none`">
              </button>
            </div>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
          <button @click="showAddModal=false" :disabled="submitting" 
            :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.5' : '1'}`">Cancel</button>
          <button @click="handleAdd" :disabled="submitting" 
            :style="`background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.8' : '1'}`">
            <Icon v-if="submitting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            {{ submitting ? 'Creating...' : 'Add Type' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── EDIT MODAL ── -->
    <div v-if="showEditModal" @click.self="showEditModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Edit Customer Type</h2>
          <button @click="showEditModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div v-if="editError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ editError }}</div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Name <span style="color:#ef4444">*</span></label>
            <input v-model="editForm.name" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
            <textarea v-model="editForm.description" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Badge Color</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button v-for="c in colorOptions" :key="c" @click="editForm.color=c"
                :style="`width:28px;height:28px;border-radius:50%;background:${c};border:${editForm.color===c ? '3px solid #1a1a1a' : '2px solid transparent'};cursor:pointer;outline:none`">
              </button>
            </div>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
          <button @click="showEditModal=false" :disabled="submitting" 
            :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.5' : '1'}`">Cancel</button>
          <button @click="handleEdit" :disabled="submitting" 
            :style="`background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.8' : '1'}`">
            <Icon v-if="submitting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            {{ submitting ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── DELETE MODAL ── -->
    <div v-if="showDeleteModal" @click.self="showDeleteModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:400px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Delete Customer Type</h2>
          <button @click="showDeleteModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:28px 24px;text-align:center">
          <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <Icon name="lucide:trash-2" style="width:24px;height:24px;color:#ef4444" />
          </div>
          <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 8px">Delete "{{ deleteTarget?.name }}"?</p>
          <p style="font-size:13px;color:#6b7280;margin:0">This action cannot be undone. All configuration for this type will be permanently removed.</p>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
          <button @click="showDeleteModal=false" :disabled="deleting" 
            :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${deleting ? 'not-allowed' : 'pointer'};opacity:${deleting ? '0.5' : '1'}`">Cancel</button>
          <button @click="handleDelete" :disabled="deleting" 
            :style="`background:#ef4444;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${deleting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${deleting ? '0.8' : '1'}`">
            <Icon v-if="deleting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    </template>

  </div>
</template>
