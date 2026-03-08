<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const products = ref([
  { id: 1, name: 'Standard Waste Bin',        sku: 'WB-120-STD', category: 'Bins',     price: 'GHS 89.99', stock: 45, status: 'active' },
  { id: 2, name: 'Recycling Bin',             sku: 'RB-80-STD',  category: 'Bins',     price: 'GHS 79.99', stock: 32, status: 'active' },
  { id: 3, name: 'Heavy Duty Bin Bags 50pk',  sku: 'BB-50-HD',   category: 'Bin Bags', price: 'GHS 24.99', stock: 15, status: 'active' },
  { id: 4, name: 'Eco-Friendly Bin Bags 100pk', sku: 'BB-100-ECO', category: 'Bin Bags', price: 'GHS 39.99', stock: 8,  status: 'active' },
  { id: 5, name: 'Bin Cleaning Brush',        sku: 'BR-001',     category: 'Brush',    price: 'GHS 14.99', stock: 67, status: 'active' },
  { id: 6, name: 'Bin Deodorizer Soap 3pk',   sku: 'SP-003',     category: 'Soap',     price: 'GHS 12.99', stock: 89, status: 'active' },
])
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
      <NuxtLink to="/shop/products/add" style="text-decoration:none">
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

    <!-- Table card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
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
            v-for="(p, i) in products"
            :key="p.id"
            :style="`border-bottom:${i < products.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.name }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ p.sku }}</td>
            <td style="padding:20px 16px">
              <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;background:#e5e7eb;color:#6b7280;border:1px solid #e5e7eb">
                {{ p.category }}
              </span>
            </td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.price }}</td>
            <td style="padding:20px 16px">
              <span :style="`font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;color:${p.stock <= 20 ? '#ef4444' : '#1a1a1a'}`">
                {{ p.stock }}
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
                  @mouseover="($event.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.1)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-trash-2" style="width:16px;height:16px;color:#ef4444" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>
