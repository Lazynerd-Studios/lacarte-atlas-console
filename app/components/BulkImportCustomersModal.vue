<script setup lang="ts">
// Customer bulk import (frontend-web-customer-bulk-import.md) — review-before-commit flow:
// download template → upload .xlsx → dry-run preview (creates nothing) → commit re-upload.
// The server re-validates on commit and never trusts the preview, so the same (or a
// corrected) file is re-uploaded; any 4xx means "rejected, nothing created".
import type { ImportPreviewResponse, ImportCommitResponse } from '~/types/customer'
import {
  validateImportFile,
  parseImportResponse,
  canCommitImport,
  importRowTone,
  templateFilename,
} from '~/utils/bulkImport'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported'): void
}>()

const api = useApi()
const toast = useAppToast()

type Step = 'select' | 'preview' | 'result'
const step = ref<Step>('select')
const file = ref<File | null>(null)
const fileError = ref('')
// Server rejection banner (422/400/etc.) — always means nothing was created
const bannerError = ref('')
const validating = ref(false)
const committing = ref(false)
const downloading = ref(false)
const preview = ref<ImportPreviewResponse | null>(null)
const result = ref<ImportCommitResponse | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const busy = computed(() => validating.value || committing.value)
const commitEnabled = computed(() => step.value === 'preview' && canCommitImport(preview.value) && !busy.value)

async function downloadTemplate() {
  downloading.value = true
  bannerError.value = ''
  try {
    const res = await api.authFetch('/customer/admin/import/template')
    if (!res.ok) throw new Error(`Template download failed (${res.status})`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = templateFilename(res.headers.get('Content-Disposition'))
    a.click()
    URL.revokeObjectURL(url)
  } catch (err: unknown) {
    bannerError.value = err instanceof Error ? err.message : 'Failed to download the template.'
  } finally {
    downloading.value = false
  }
}

function pickFile() {
  if (!busy.value) fileInput.value?.click()
}

function acceptFile(f: File) {
  const err = validateImportFile({ name: f.name, size: f.size })
  fileError.value = err ?? ''
  file.value = err ? null : f
  bannerError.value = ''
  preview.value = null
}

function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  // Clear the input value so re-picking the same file name after editing it
  // externally still fires change
  input.value = ''
  if (f) acceptFile(f)
}

function onDrop(e: DragEvent) {
  if (busy.value) return
  const f = e.dataTransfer?.files?.[0]
  if (f) acceptFile(f)
}

async function uploadTo(path: string): Promise<{ ok: true; res: Response } | { ok: false; message: string }> {
  if (!file.value) return { ok: false, message: 'Choose a .xlsx file first.' }
  try {
    const fd = new FormData()
    fd.append('file', file.value) // doc §6: multipart field name is "file"
    const res = await api.authFetch(path, { method: 'POST', body: fd })
    return { ok: true, res }
  } catch (err: unknown) {
    // authFetch throws on network errors and after its own 401 logout+redirect
    return { ok: false, message: err instanceof Error ? err.message : 'Upload failed.' }
  }
}

async function runValidation() {
  if (!file.value || busy.value) return
  validating.value = true
  bannerError.value = ''
  fileError.value = ''
  const outcome = await uploadTo('/customer/admin/import/validate')
  if (!outcome.ok) {
    bannerError.value = outcome.message
  } else {
    const parsed = await parseImportResponse<ImportPreviewResponse>(outcome.res)
    if (parsed.ok) {
      preview.value = parsed.data
      step.value = 'preview'
    } else {
      bannerError.value = parsed.message
    }
  }
  validating.value = false
}

async function commitImport() {
  if (!commitEnabled.value) return
  committing.value = true
  bannerError.value = ''
  const outcome = await uploadTo('/customer/admin/import')
  if (!outcome.ok) {
    bannerError.value = outcome.message
  } else {
    const parsed = await parseImportResponse<ImportCommitResponse>(outcome.res)
    if (parsed.ok) {
      result.value = parsed.data
      step.value = 'result'
      if (parsed.data.created > 0) {
        toast.success(`${parsed.data.created} customer${parsed.data.created === 1 ? '' : 's'} imported — temp passwords were emailed`)
        emit('imported') // refresh the customer list behind the modal
      } else {
        toast.warning('Import finished', 'No customers were created — see the summary below.')
      }
    } else {
      // 4xx on commit: rejected wholesale, nothing created — force a fresh file pick
      bannerError.value = parsed.message
      file.value = null
      preview.value = null
      step.value = 'select'
    }
  }
  committing.value = false
}

function backToSelect() {
  step.value = 'select'
  preview.value = null
  result.value = null
  file.value = null
  bannerError.value = ''
  fileError.value = ''
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="!busy && emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:100%;max-width:760px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1);position:relative">

      <!-- Header -->
      <div style="padding:24px 24px 16px;flex-shrink:0;border-bottom:1px solid #e5e7eb">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Bulk Import Customers</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">
          {{ step === 'select' ? 'Download the template, fill it in, then upload for a review before anything is created.'
           : step === 'preview' ? 'Review the preview below — validation creates nothing yet.'
           : 'Import finished. Duplicate rows were skipped, not failed.' }}
        </p>
      </div>

      <!-- Close -->
      <button
        :disabled="busy"
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Body -->
      <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">

        <!-- Server rejection banner (422/400/...): nothing was created -->
        <div
          v-if="bannerError"
          role="alert"
          style="display:flex;align-items:flex-start;gap:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px 14px;font-size:13px;font-family:'Manrope',sans-serif;line-height:1.5;color:#ef4444"
        >
          <UIcon name="i-lucide-x-circle" style="width:16px;height:16px;flex-shrink:0;margin-top:1px" />
          <span>{{ bannerError }}</span>
        </div>

        <!-- ── STEP 1: template + file pick ── -->
        <template v-if="step === 'select'">
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button
              type="button"
              :disabled="downloading || busy"
              :style="`display:flex;align-items:center;gap:8px;height:40px;padding:0 18px;background:rgba(255,180,0,0.12);border:1px dashed #ffb400;border-radius:12px;font-size:13px;font-weight:600;color:#b45309;font-family:'Manrope',sans-serif;cursor:${downloading || busy ? 'not-allowed' : 'pointer'}`"
              @click="downloadTemplate"
            >
              <UIcon :name="downloading ? 'i-lucide-loader-2' : 'i-lucide-file-down'" :style="`width:15px;height:15px;${downloading ? 'animation:spin 1s linear infinite' : ''}`" />
              {{ downloading ? 'Preparing…' : 'Download Excel template' }}
            </button>
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;align-self:center">
              Customer types and zones arrive as dropdowns · max 100 rows · under 1 MB
            </span>
          </div>

          <!-- Drop / pick area -->
          <div
            :style="`border:1.5px dashed ${fileError ? '#ef4444' : file ? '#ffb400' : '#e5e7eb'};border-radius:14px;padding:32px 24px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:${busy ? 'default' : 'pointer'};background:${file ? '#fff9e6' : '#fafafa'}`"
            @click="pickFile"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <input ref="fileInput" type="file" accept=".xlsx" style="display:none" @change="onFilePicked" />
            <UIcon :name="file ? 'i-lucide-file-spreadsheet' : 'i-lucide-upload'" :style="`width:28px;height:28px;color:${file ? '#b45309' : '#9ca3af'}`" />
            <p v-if="!file" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Click to choose a <strong>.xlsx</strong> file (or drag it here)</p>
            <template v-else>
              <p style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">{{ file.name }}</p>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ (file.size / 1024).toFixed(0) }} KB · click to replace</p>
            </template>
            <p v-if="fileError" style="font-size:13px;color:#ef4444;font-family:'Manrope',sans-serif;margin:0">{{ fileError }}</p>
          </div>
        </template>

        <!-- ── STEP 2: preview table ── -->
        <template v-else-if="step === 'preview' && preview">
          <!-- Summary chips -->
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:600;color:#374151;background:#f3f4f6;border-radius:20px;padding:5px 14px">Total {{ preview.total }}</span>
            <span style="font-size:13px;font-weight:600;color:#16a34a;background:#dcfce7;border-radius:20px;padding:5px 14px">Ready {{ preview.valid }}</span>
            <span style="font-size:13px;font-weight:600;color:#ef4444;background:#fef2f2;border-radius:20px;padding:5px 14px">Fix {{ preview.invalid }}</span>
            <span style="font-size:13px;font-weight:600;color:#6b7280;background:#f3f4f6;border-radius:20px;padding:5px 14px">Duplicate {{ preview.duplicate }}</span>
          </div>

          <div style="border:1px solid #ececec;border-radius:12px;overflow:auto;max-height:340px">
            <table style="width:100%;border-collapse:collapse;min-width:620px">
              <thead>
                <tr style="background:#f8f9fa;position:sticky;top:0">
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Row</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Status</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Email</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Name</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Type / Zone</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Issues</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in preview.rows" :key="r.row" style="border-bottom:1px solid #f5f5f5;vertical-align:top">
                  <td style="padding:10px 14px;font-size:13px;color:#6b7280">{{ r.row }}</td>
                  <td style="padding:10px 14px">
                    <span :style="`font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${importRowTone(r.status).bg};color:${importRowTone(r.status).fg}`">
                      {{ importRowTone(r.status).label }}
                    </span>
                  </td>
                  <td style="padding:10px 14px;font-size:13px;color:#1a1a1a">{{ r.email || '—' }}</td>
                  <td style="padding:10px 14px;font-size:13px;color:#1a1a1a">
                    {{ r.fullName || '—' }}
                    <span v-if="r.businessName" style="display:block;font-size:11px;color:#6b7280">{{ r.businessName }}</span>
                  </td>
                  <td style="padding:10px 14px;font-size:13px;color:#1a1a1a">
                    {{ r.customerType?.name ?? '—' }}
                    <span v-if="r.pricingMode" :style="`display:inline-block;margin-left:6px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;background:${r.pricingMode === 'per_bin' ? '#f0f9ff' : '#fdf4ff'};color:${r.pricingMode === 'per_bin' ? '#0369a1' : '#a21caf'}`">{{ r.pricingMode === 'per_bin' ? 'per bin' : 'full truck' }}</span>
                    <span style="display:block;font-size:12px;color:#6b7280">{{ r.zone?.name ?? (r.status === 'invalid' ? 'zone unresolved' : '—') }}</span>
                  </td>
                  <td style="padding:10px 14px">
                    <p v-for="(iss, ii) in r.issues" :key="ii" style="margin:0 0 2px;font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">
                      <strong>{{ iss.field }}</strong> — {{ iss.message }}
                    </p>
                    <span v-if="!r.issues.length" style="font-size:12px;color:#9ca3af">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">
            Only “Ready” rows will be created. The server re-validates at import time, so if the sheet changed since this preview you can fix and re-upload instead.
          </p>
        </template>

        <!-- ── STEP 3: commit result ── -->
        <template v-else-if="step === 'result' && result">
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:600;color:#16a34a;background:#dcfce7;border-radius:20px;padding:5px 14px">Created {{ result.created }}</span>
            <span style="font-size:13px;font-weight:600;color:#6b7280;background:#f3f4f6;border-radius:20px;padding:5px 14px">Skipped {{ result.skipped }}</span>
            <span style="font-size:13px;font-weight:600;color:#ef4444;background:#fef2f2;border-radius:20px;padding:5px 14px">Failed {{ result.failed }}</span>
            <span v-if="result.needsBins > 0" style="font-size:13px;font-weight:600;color:#b45309;background:#fffbeb;border-radius:20px;padding:5px 14px">Need bins {{ result.needsBins }}</span>
          </div>

          <!-- needsBins CTA: per_bin customers can't be subscribed/priced until bins are set -->
          <div v-if="result.needsBins > 0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;display:flex;gap:10px;align-items:flex-start">
            <UIcon name="i-lucide-trash-2" style="width:18px;height:18px;color:#b45309;flex-shrink:0;margin-top:1px" />
            <div style="flex:1">
              <p style="font-size:13px;color:#92400e;font-family:'Manrope',sans-serif;margin:0">
                {{ result.needsBins }} per-bin customer{{ result.needsBins === 1 ? '' : 's' }} still need a bin inventory before they can be subscribed or priced for pay-as-you-go.
              </p>
              <button type="button" @click="emit('close')" style="margin-top:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
                Go to Customers → Bin Mix
              </button>
            </div>
          </div>

          <!-- Failed rows use the same field/issue renderer as the preview (doc §4) -->
          <div v-if="result.errors.length" style="border:1px solid #fecaca;border-radius:12px;overflow:auto;max-height:260px">
            <table style="width:100%;border-collapse:collapse;min-width:520px">
              <thead>
                <tr style="background:#fef2f2;position:sticky;top:0">
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#991b1b">Row</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#991b1b">Email</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#991b1b">Why it failed</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in result.errors" :key="e.row" style="border-bottom:1px solid #fee2e2;vertical-align:top">
                  <td style="padding:10px 14px;font-size:13px;color:#6b7280">{{ e.row }}</td>
                  <td style="padding:10px 14px;font-size:13px;color:#1a1a1a">{{ e.email || '—' }}</td>
                  <td style="padding:10px 14px">
                    <p v-for="(iss, ii) in e.issues" :key="ii" style="margin:0 0 2px;font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">
                      <strong>{{ iss.field }}</strong> — {{ iss.message }}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">
            Created accounts received a temporary password by email and can sign in immediately.
          </p>
        </template>
      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
        <template v-if="step === 'select'">
          <button
            :disabled="busy"
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="emit('close')"
          >Cancel</button>
          <button
            :disabled="!file || busy"
            :style="`display:flex;align-items:center;gap:8px;height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:${!file || busy ? 'not-allowed' : 'pointer'};opacity:${!file || busy ? 0.6 : 1}`"
            @click="runValidation"
          >
            <UIcon v-if="validating" name="i-lucide-loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            {{ validating ? 'Validating…' : 'Validate file' }}
          </button>
        </template>
        <template v-else-if="step === 'preview'">
          <button
            :disabled="busy"
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="backToSelect"
          >Fix &amp; re-upload</button>
          <button
            :disabled="!commitEnabled"
            :style="`display:flex;align-items:center;gap:8px;height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:${!commitEnabled ? 'not-allowed' : 'pointer'};opacity:${!commitEnabled ? 0.6 : 1}`"
            @click="commitImport"
          >
            <UIcon v-if="committing" name="i-lucide-loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            {{ committing ? 'Importing…' : `Import ${preview?.valid ?? 0} customers` }}
          </button>
        </template>
        <template v-else>
          <button
            style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="emit('close')"
          >Done</button>
        </template>
      </div>
    </div>
  </div>
</template>
