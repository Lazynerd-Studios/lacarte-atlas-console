<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()

// Pre-filled with existing product data (would be fetched by ID in real app)
const form = reactive({
  name: 'Standard Waste Bin',
  sku: 'WB-120-STD',
  description: 'Durable 120-liter waste bin designed for residential and commercial use. Features weather-resistant construction, easy-lift handles, and compatible with standard waste collection vehicles.',
  category: 'Bins',
  price: '89.99',
  stock: '45',
  status: 'active',
})

const categories = ['Bins', 'Bin Bags', 'Brush', 'Soap', 'Other']
const statuses = ['active', 'inactive', 'draft']

function handleUpdate() {
  router.push(`/shop/products/${route.params.id}`)
}

function handleDelete() {
  router.push('/shop/products')
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Back link -->
    <NuxtLink :to="`/shop/products/${route.params.id}`" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#6b7280;font-size:14px;font-family:'Manrope',sans-serif;width:fit-content">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
      Back to Products
    </NuxtLink>

    <!-- Header -->
    <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Edit Product</h1>

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
                  v-model="form.category"
                  style="height:42px;border:1px solid #e5e7eb;border-radius:16px;padding:0 36px 0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box;appearance:none;background:white;cursor:pointer"
                  @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
                >
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
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
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Price</label>
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
                v-model="form.stock"
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
          <div
            style="border:2px dashed #e5e7eb;border-radius:16px;height:192px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.borderColor='#ffb400'"
            @mouseleave="($event.currentTarget as HTMLElement).style.borderColor='#e5e7eb'"
          >
            <UIcon name="i-lucide-upload-cloud" style="width:48px;height:48px;color:#6b7280" />
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Drag and drop images here or click to browse</p>
            <button
              style="height:32px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
            >Choose Files</button>
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
              @click="handleUpdate"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >Update Product</button>
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
