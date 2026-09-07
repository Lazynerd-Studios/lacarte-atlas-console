<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const api = useApi()
const toast = useAppToast()

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  stockQuantity: number
  reorderPoint: number
  unitCost: number
  status: string
  images: string[]
  category: { id: string; name: string }
}

const form = reactive({
  name: '',
  sku: '',
  description: '',
  categoryId: '',
  price: '',
  stockQuantity: '',
  reorderPoint: '',
  unitCost: '',
  status: 'active',
})

const categories = ref<Category[]>([])
const statuses = ['active', 'inactive', 'draft']
const loading = ref(true)
const submitting = ref(false)

// Image upload — deduplicated via composable
const {
  imagePreviews,
  uploading,
  isDragging,
  handleFileSelect,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  removeImage,
} = useProductImageUpload(5)

function openFilePicker() {
  const input = document.getElementById('edit-product-image-input') as HTMLInputElement
  input?.click()
}

async function fetchProduct() {
  loading.value = true
  try {
    const data = await api.get<Product>(
      `/store/admin/products/${route.params.id}`,
      'Failed to load product'
    )
    if (data) {
      form.name = data.name
      form.sku = data.sku
      form.description = data.description || ''
      form.categoryId = data.category?.id || ''
      form.price = String(data.price)
      form.stockQuantity = String(data.stockQuantity)
      form.reorderPoint = String(data.reorderPoint)
      form.unitCost = String(data.unitCost)
      form.status = data.status
      // Load existing product images into previews
      if (data.images?.length) {
        imagePreviews.value = [...data.images]
      }
      console.log('[edit-product] Loaded product:', data)
    }
  } catch (err) {
    console.error('Error fetching product:', err)
  }
  loading.value = false
}

async function fetchCategories() {
  const data = await api.get<{ data: Category[] }>(
    '/store/admin/categories/',
    'Failed to load categories'
  )
  if (data?.data) {
    categories.value = data.data
  }
}

async function handleUpdate() {
  if (!form.name.trim()) {
    toast.error('Validation error', 'Product name is required.')
    return
  }

  submitting.value = true
  try {
    // Images are already uploaded on select — previews hold the hosted URLs
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      price: Number(form.price) || 0,
      stockQuantity: Number(form.stockQuantity) || 0,
      reorderPoint: Number(form.reorderPoint) || 0,
      unitCost: Number(form.unitCost) || 0,
      status: form.status,
      images: imagePreviews.value,
    }
    console.log('[edit-product] Updating product with payload:', payload)
    const data = await api.patch(
      `/store/admin/products/${route.params.id}`,
      payload,
      'Failed to update product'
    )
    console.log('[edit-product] Update product response:', data)
    if (data) {
      toast.success('Product updated', `"${form.name}" has been updated successfully.`)
      router.push(`/shop/products/${route.params.id}`)
    }
  } catch (err) {
    console.error('Error updating product:', err)
  }
  submitting.value = false
}

async function handleDelete() {
  try {
    await api.del(
      `/store/admin/products/${route.params.id}`,
      'Failed to delete product'
    )
    toast.success('Product deleted', 'Product has been removed successfully.')
    router.push('/shop/products')
  } catch (err) {
    console.error('Error deleting product:', err)
  }
}

onMounted(() => {
  fetchProduct()
  fetchCategories()
})
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Back link -->
    <NuxtLink :to="`/shop/products/${route.params.id}`" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#6b7280;font-size:14px;font-family:'Manrope',sans-serif;width:fit-content">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
      Back to Products
    </NuxtLink>

    <!-- Header -->
    <div v-if="loading" style="display:flex;align-items:center;gap:12px">
      <div style="width:200px;height:32px;background:#f3f4f6;border-radius:8px;animation:pulse 1.5s infinite"></div>
    </div>
    <h1 v-else style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Edit Product</h1>

    <!-- Form layout -->
    <div style="display:grid;grid-template-columns:1fr 344px;gap:24px;align-items:start">

      <!-- Left column -->
      <div style="display:flex;flex-direction:column;gap:24px">

        <!-- Product Information card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Product Information</p>
          <div style="display:flex;flex-direction:column;gap:16px">

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Product Name</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g., Standard Waste Bin"
                style="height:39px;border:1px solid #e5e7eb;border-radius:16px;padding:0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">SKU</label>
              <input
                v-model="form.sku"
                type="text"
                placeholder="e.g., WB-120-STD"
                style="height:39px;border:1px solid #e5e7eb;border-radius:16px;padding:0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Description</label>
              <textarea
                v-model="form.description"
                placeholder="Enter product description..."
                rows="4"
                style="border:1px solid #e5e7eb;border-radius:16px;padding:8px 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box;resize:vertical;line-height:1.5"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Category</label>
              <div style="position:relative">
                <select
                  v-model="form.categoryId"
                  style="height:42px;border:1px solid #e5e7eb;border-radius:16px;padding:0 36px 0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box;appearance:none;background:white;cursor:pointer"
                  @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
                >
                  <option value="" disabled>Select category</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
              </div>
            </div>

          </div>
        </div>

        <!-- Pricing & Inventory card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Pricing &amp; Inventory</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Price (GHS)</label>
              <input
                v-model="form.price"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                style="height:39px;border:1px solid #e5e7eb;border-radius:16px;padding:0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Stock Quantity</label>
              <input
                v-model="form.stockQuantity"
                type="number"
                placeholder="0"
                min="0"
                style="height:39px;border:1px solid #e5e7eb;border-radius:16px;padding:0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Unit Cost (GHS)</label>
              <input
                v-model="form.unitCost"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                style="height:39px;border:1px solid #e5e7eb;border-radius:16px;padding:0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Reorder Point</label>
              <input
                v-model="form.reorderPoint"
                type="number"
                placeholder="0"
                min="0"
                style="height:39px;border:1px solid #e5e7eb;border-radius:16px;padding:0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

          </div>
        </div>

        <!-- Product Images card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Product Images</p>

          <!-- Hidden file input -->
          <input
            id="edit-product-image-input"
            type="file"
            accept="image/*"
            multiple
            style="display:none"
            @change="handleFileSelect"
          />

          <!-- Drop zone -->
          <div
            :style="`border:2px dashed ${isDragging ? '#ffb400' : '#e5e7eb'};border-radius:16px;padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;transition:border-color 0.15s;${isDragging ? 'background:rgba(255,180,0,0.05)' : ''}`"
            @click="openFilePicker"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <UIcon :name="uploading ? 'i-lucide-loader-2' : 'i-lucide-upload-cloud'" :style="`width:48px;height:48px;color:${isDragging || uploading ? '#ffb400' : '#6b7280'};${uploading ? 'animation:spin 1s linear infinite' : ''}`" />
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center">{{ uploading ? 'Uploading images...' : 'Drag and drop images here or click to browse' }}</p>
            <p style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif">PNG, JPG up to 5 images</p>
          </div>

          <!-- Image previews -->
          <div v-if="imagePreviews.length > 0" style="display:flex;flex-wrap:wrap;gap:12px;margin-top:16px">
            <div
              v-for="(preview, i) in imagePreviews"
              :key="i"
              style="position:relative;width:80px;height:80px;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb"
            >
              <img :src="preview" alt="Preview" style="width:100%;height:100%;object-fit:cover" />
              <button
                style="position:absolute;top:4px;right:4px;width:20px;height:20px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center"
                title="Remove"
                @click.stop="removeImage(i)"
              >
                <UIcon name="i-lucide-x" style="width:12px;height:12px;color:white" />
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Right column -->
      <div style="display:flex;flex-direction:column;gap:24px">

        <!-- Status card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Status</p>
          <div style="position:relative">
            <select
              v-model="form.status"
              style="height:42px;border:1px solid #e5e7eb;border-radius:16px;padding:0 36px 0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box;appearance:none;background:white;cursor:pointer"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
            >
              <option v-for="s in statuses" :key="s" :value="s">{{ s.charAt(0).toUpperCase() + s.slice(1) }}</option>
            </select>
            <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
          </div>
        </div>

        <!-- Actions card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Actions</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <button
              style="width:100%;height:40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
              :disabled="submitting"
              @click="handleUpdate"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >{{ submitting ? 'Updating...' : 'Update Product' }}</button>
            <NuxtLink :to="`/shop/products/${route.params.id}`" style="text-decoration:none">
              <button
                style="width:100%;height:40px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
                @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
              >Cancel</button>
            </NuxtLink>
            <button
              style="width:100%;height:40px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
              @click="handleDelete"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >Delete Product</button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
