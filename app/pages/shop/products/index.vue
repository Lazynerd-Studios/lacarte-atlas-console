<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const api = useApi()
const toast = useAppToast()

interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  stockQuantity: number
  reorderPoint: number
  unitCost: number
  isLowStock: boolean
  status: string
  images: string[]
  category: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface ProductsResponse {
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

const products = ref<Product[]>([])
const productsLoading = ref(false)
const totalProducts = ref(0)

const search = ref('')
const currentPage = ref(1)
const perPage = 20

async function fetchProducts() {
  productsLoading.value = true
  try {
    const data = await api.get<ProductsResponse>(
      `/store/admin/products/?page=${currentPage.value}&limit=${perPage}`,
      'Failed to load products'
    )
    if (data?.data) {
      products.value = data.data
      totalProducts.value = data.pagination?.total ?? data.data.length
    }
  } catch (err) {
    console.error('Error fetching products:', err)
  }
  productsLoading.value = false
}

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return products.value
  return products.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.category.name.toLowerCase().includes(q)
  )
})

watch(search, () => { currentPage.value = 1 })
watch(currentPage, () => { fetchProducts() })

// Tabs
const activeTab = ref<'products' | 'categories'>('products')

// Categories list from API
interface Category {
  id: string
  name: string
  description: string
  createdAt: string | null
  updatedAt: string | null
}

// Add Category
const showAddCategoryModal = ref(false)
const categories = ref<Category[]>([])
const categoriesLoading = ref(false)

async function fetchCategories() {
  categoriesLoading.value = true
  try {
    const data = await api.get<{ data: Category[] }>(
      '/store/admin/categories/',
      'Failed to load categories'
    )
    if (data?.data) {
      categories.value = data.data
    }
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
  categoriesLoading.value = false
}

async function handleAddCategory(payload: { name: string; description: string }) {
  try {
    const data = await api.post<Category>(
      '/store/admin/categories/',
      payload,
      'Failed to create category'
    )
    if (data) {
      categories.value.push(data)
      toast.success('Category created', `"${data.name}" has been added successfully.`)
    }
  } catch (err) {
    console.error('Error creating category:', err)
  }
  showAddCategoryModal.value = false
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})

// Delete Category
const showDeleteCategoryModal = ref(false)
const selectedCategory = ref<Category | null>(null)

function openDeleteCategory(cat: Category) {
  selectedCategory.value = cat
  showDeleteCategoryModal.value = true
}

async function handleDeleteCategory() {
  if (!selectedCategory.value) return
  try {
    await api.del(
      `/store/admin/categories/${selectedCategory.value.id}`,
      'Failed to delete category'
    )
    categories.value = categories.value.filter(c => c.id !== selectedCategory.value!.id)
    toast.success('Category deleted', `"${selectedCategory.value.name}" has been removed.`)
  } catch (err) {
    console.error('Error deleting category:', err)
  }
  showDeleteCategoryModal.value = false
  selectedCategory.value = null
}

// Delete Product
const showDeleteModal = ref(false)
const selectedProduct = ref<Product | null>(null)

function openDelete(p: Product) {
  selectedProduct.value = p
  showDeleteModal.value = true
}

async function handleDelete(id: string) {
  try {
    await api.del(
      `/store/admin/products/${id}`,
      'Failed to delete product'
    )
    products.value = products.value.filter(p => p.id !== id)
    totalProducts.value--
    toast.success('Product deleted', 'Product has been removed successfully.')
  } catch (err) {
    console.error('Error deleting product:', err)
  }
  showDeleteModal.value = false
  selectedProduct.value = null
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Back link -->
    <NuxtLink to="/shop" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#6b7280;font-size:14px;font-family:'Manrope',sans-serif;width:fit-content">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
      Back to Shop
    </NuxtLink>

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Products</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">Manage your product catalog</p>
      </div>
      <div style="display:flex;gap:8px">
        <button
          v-if="activeTab === 'categories'"
          style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
          @click="showAddCategoryModal = true"
          @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
        >
          <UIcon name="i-lucide-plus" style="width:16px;height:16px" />
          Add Category
        </button>
        <NuxtLink v-if="activeTab === 'products'" to="/shop/products/add" style="text-decoration:none">
          <button
            style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
          >
            <UIcon name="i-lucide-plus" style="width:16px;height:16px" />
            Add Product
          </button>
        </NuxtLink>
      </div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:4px;background:#f3f4f6;border-radius:12px;padding:4px;width:fit-content">
      <button @click="activeTab='products'"
        :style="`padding:8px 24px;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab==='products' ? 'background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,0.1)' : 'background:transparent;color:#6b7280'}`">
        Products
      </button>
      <button @click="activeTab='categories'"
        :style="`padding:8px 24px;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab==='categories' ? 'background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,0.1)' : 'background:transparent;color:#6b7280'}`">
        Categories
      </button>
    </div>

    <!-- Products Tab -->
    <div v-if="activeTab === 'products'">
    <!-- Table card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

      <!-- Search -->
      <div style="position:relative;margin-bottom:16px;max-width:320px">
        <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
        <input
          v-model="search"
          type="text"
          placeholder="Search products..."
          style="width:100%;height:38px;padding:0 12px 0 36px;border:1px solid #e5e7eb;border-radius:20px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:white"
          @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
          @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
        />
      </div>

      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Product</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">SKU</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Category</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Price</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Stock</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(p, i) in filtered"
            :key="p.id"
            :style="`border-bottom:${i < filtered.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.name }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ p.sku }}</td>
            <td style="padding:20px 16px">
              <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;background:#e5e7eb;color:#6b7280;border:1px solid #e5e7eb">
                {{ p.category.name }}
              </span>
            </td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">GHS {{ p.price.toFixed(2) }}</td>
            <td style="padding:20px 16px">
              <span :style="`font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;color:${p.isLowStock ? '#ef4444' : p.stockQuantity <= 20 ? '#d49a00' : '#1a1a1a'}`">
                {{ p.stockQuantity }}
              </span>
            </td>
            <td style="padding:20px 16px">
              <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2)">
                {{ p.status }}
              </span>
            </td>
            <td style="padding:20px 16px;text-align:right">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px">
                <NuxtLink :to="`/shop/products/${p.id}`" style="text-decoration:none">
                  <button
                    style="width:32px;height:32px;background:none;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center"
                    title="View"
                    @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                  >
                    <UIcon name="i-lucide-eye" style="width:16px;height:16px;color:#6b7280" />
                  </button>
                </NuxtLink>
                <NuxtLink :to="`/shop/products/${p.id}/edit`" style="text-decoration:none">
                  <button
                    style="width:32px;height:32px;background:none;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center"
                    title="Edit"
                    @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                  >
                    <UIcon name="i-lucide-pencil" style="width:16px;height:16px;color:#6b7280" />
                  </button>
                </NuxtLink>
                <button
                  style="width:32px;height:32px;background:none;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  title="Delete"
                  @click="openDelete(p)"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.1)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-trash-2" style="width:16px;height:16px;color:#ef4444" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0 && !productsLoading">
            <td colspan="7" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No products found.</td>
          </tr>
          <template v-if="productsLoading">
            <tr v-for="i in 5" :key="`sk-${i}`" style="border-bottom:1px solid #e5e7eb">
              <td v-for="j in 7" :key="j" style="padding:20px 16px"><div class="skeleton" style="height:14px;width:100%" /></td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Pagination -->
      <div style="padding-top:16px;border-top:1px solid #e5e7eb;margin-top:4px">
        <AppPagination
          :page="currentPage"
          :total="totalProducts"
          :per-page="perPage"
          @update:page="currentPage = $event"
        />
      </div>
    </div>
    </div>

    <!-- Categories Tab -->
    <div v-if="activeTab === 'categories'">
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Name</th>
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Description</th>
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Created</th>
              <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(cat, i) in categories"
              :key="cat.id"
              :style="`border-bottom:${i < categories.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
            >
              <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ cat.name }}</td>
              <td style="padding:20px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ cat.description || '—' }}</td>
              <td style="padding:20px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' }}</td>
              <td style="padding:20px 16px;text-align:right">
                <button
                  style="width:32px;height:32px;background:none;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-left:auto"
                  title="Delete"
                  @click="openDeleteCategory(cat)"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.1)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-trash-2" style="width:16px;height:16px;color:#ef4444" />
                </button>
              </td>
            </tr>
            <tr v-if="categories.length === 0 && !categoriesLoading">
              <td colspan="4" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No categories yet. Click "Add Category" to create one.</td>
            </tr>
            <tr v-if="categoriesLoading">
              <td colspan="4" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading categories...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <AddCategoryModal
    v-if="showAddCategoryModal"
    @close="showAddCategoryModal = false"
    @submit="handleAddCategory"
  />

  <LazyDeleteProductModal
    v-if="showDeleteModal && selectedProduct"
    :product-name="selectedProduct.name"
    :product-id="selectedProduct.id"
    @close="showDeleteModal = false"
    @confirm="(id) => handleDelete(String(id))"
  />

  <!-- Delete Category Confirmation -->
  <div
    v-if="showDeleteCategoryModal && selectedCategory"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="showDeleteCategoryModal = false"
  >
    <div style="background:white;border-radius:16px;width:400px;padding:24px;box-shadow:0 10px 15px rgba(0,0,0,0.1)">
      <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin-bottom:12px">Delete Category</p>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:24px">Are you sure you want to delete <strong>"{{ selectedCategory.name }}"</strong>? This action cannot be undone.</p>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="showDeleteCategoryModal = false"
        >Cancel</button>
        <button
          style="height:40px;padding:0 20px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="handleDeleteCategory"
        >Delete</button>
      </div>
    </div>
  </div>

</template>
