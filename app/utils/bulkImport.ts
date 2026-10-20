// Pure helpers for customer bulk import (frontend-web-customer-bulk-import.md).
// Kept out of the SFC so they can be unit-tested, per the repo's
// rateValidation/teamValidation convention.

/** Doc §5: files over 1 MB are rejected by the server (422) — pre-flight the same limit. */
export const IMPORT_MAX_BYTES = 1024 * 1024

/**
 * Client-side file guard for the upload step. Returns a user-facing error
 * message, or null when the file may be uploaded. The server stays the
 * authority — this only pre-flights the 422 cases (non-Excel / oversized).
 */
export function validateImportFile(file: { name: string; size: number }): string | null {
  if (!/\.xlsx$/i.test(file.name)) {
    return 'Only .xlsx files are supported — save your sheet as Excel (.xlsx) and try again.'
  }
  if (file.size > IMPORT_MAX_BYTES) {
    return 'This file is larger than 1 MB. Split it into smaller sheets (max 100 rows each).'
  }
  if (file.size === 0) {
    return 'This file appears to be empty.'
  }
  return null
}

/**
 * Map an upload 4xx to the §6 UI copy. The thrown message from useApi/authFetch
 * carries the server `message` when one was sent; fall back to doc wording.
 */
export function mapImportFailure(status: number, serverMessage?: string | null): string {
  if (status === 422) return serverMessage || 'Upload a valid .xlsx under 1 MB.'
  if (status === 400) return serverMessage || 'The file was rejected — nothing was created. Fix or split the sheet (max 100 data rows) and try again.'
  if (status === 403) return serverMessage || 'You do not have permission to import customers.'
  return serverMessage || `Request failed (${status}) — nothing was created.`
}

/** Commit button gate: only a prior preview with at least one valid row enables import. */
export function canCommitImport(preview: { valid: number } | null): boolean {
  return !!preview && preview.valid > 0
}

/** Filename from the template's Content-Disposition header, with a sane fallback. */
export function templateFilename(contentDisposition?: string | null): string {
  const m = contentDisposition?.match(/filename\*?="?([^";]+)"?/i)
  return m?.[1] || 'customer-import-template.xlsx'
}

export interface ImportRowTone {
  bg: string
  fg: string
  label: string
}

/** §3 preview colors: green = ready, red = fix these fields, grey = duplicate. */
export function importRowTone(status: 'valid' | 'invalid' | 'duplicate'): ImportRowTone {
  if (status === 'valid') return { bg: '#dcfce7', fg: '#16a34a', label: 'Ready' }
  if (status === 'invalid') return { bg: '#fef2f2', fg: '#ef4444', label: 'Fix' }
  return { bg: '#f3f4f6', fg: '#6b7280', label: 'Duplicate' }
}

/**
 * Read an import upload response: parse the body once, pass through JSON on
 * success, and convert any 4xx into doc-mapped UI text. Structurally typed so
 * tests can pass a fake Response.
 */
export async function parseImportResponse<T>(res: {
  ok: boolean
  status: number
  text: () => Promise<string>
}): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const text = await res.text()
  let body: any = null
  if (text) {
    try { body = JSON.parse(text) } catch { /* non-JSON body — handled below */ }
  }
  if (res.ok) return { ok: true, data: (body ?? {}) as T }
  return { ok: false, message: mapImportFailure(res.status, body?.message) }
}
