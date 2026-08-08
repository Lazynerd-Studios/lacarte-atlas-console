export function useProductImageUpload(maxImages = 5) {
  const imagePreviews = ref<string[]>([])
  const uploading = ref(false)
  const isDragging = ref(false)

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files) {
      addFiles(Array.from(input.files))
    }
    input.value = ''
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
    if (event.dataTransfer?.files) {
      addFiles(Array.from(event.dataTransfer.files))
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging.value = true
  }

  function handleDragLeave() {
    isDragging.value = false
  }

  async function addFiles(files: File[]) {
    const images = files.filter(f => f.type.startsWith('image/'))
    if (images.length === 0) return
    if (imagePreviews.value.length + images.length > maxImages) {
      const toast = useAppToast()
      toast.error('Limit reached', `You can upload a maximum of ${maxImages} images.`)
      return
    }

    uploading.value = true
    try {
      const formData = new FormData()
      for (const file of images) formData.append('files', file)

      const config = useRuntimeConfig()
      const authStore = useAuthStore()
      const res = await fetch(`${config.public.apiBase}/store/admin/products/images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authStore.token}` },
        body: formData,
      })
      if (!res.ok) {
        let detail = `Upload failed (${res.status})`
        try { detail = (await res.json()).message || detail } catch {}
        throw new Error(detail)
      }
      const data = await res.json() as { urls: string[] }
      imagePreviews.value.push(...data.urls)
    } catch (err: any) {
      console.error('[useProductImageUpload] Image upload failed:', err)
      const toast = useAppToast()
      toast.error('Upload failed', err?.message || 'Could not upload images.')
    } finally {
      uploading.value = false
    }
  }

  function removeImage(index: number) {
    imagePreviews.value.splice(index, 1)
  }

  function reset() {
    imagePreviews.value = []
    uploading.value = false
    isDragging.value = false
  }

  return {
    imagePreviews,
    uploading,
    isDragging,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    addFiles,
    removeImage,
    reset,
  }
}
