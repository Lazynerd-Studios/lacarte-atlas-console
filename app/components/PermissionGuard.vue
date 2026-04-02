<script setup lang="ts">
const props = defineProps<{
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  role?: string
  roles?: string[]
}>()

const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, isSuperAdmin } = usePermissions()

const hasAccess = computed(() => {
  // Super admin always has access
  if (isSuperAdmin.value) return true

  // Check role-based access
  if (props.role && !hasRole(props.role)) return false
  if (props.roles && !hasAnyRole(props.roles)) return false

  // Check permission-based access
  if (props.permission && !hasPermission(props.permission)) return false
  
  if (props.permissions) {
    if (props.requireAll) {
      return hasAllPermissions(props.permissions)
    } else {
      return hasAnyPermission(props.permissions)
    }
  }

  return true
})
</script>

<template>
  <slot v-if="hasAccess" />
</template>
