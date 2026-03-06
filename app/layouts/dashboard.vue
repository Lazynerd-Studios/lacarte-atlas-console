<template>
  <div style="display:flex;height:100vh;background:#f9fafb;overflow:hidden">
    <AppSidebar />
    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
      <AppHeader />
      <main style="flex:1;overflow-y:auto;padding:32px">
        <slot />
      </main>
    </div>
  </div>
</template>
