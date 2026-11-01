// Pure helpers for customer bulk import (frontend-web-customer-bulk-import.md).
// Kept out of the SFC so they can be unit-tested, per the repo's
// rateValidation/teamValidation convention.
import type { ImportPreviewResponse, ImportCommitResponse } from '~/types/customer'

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

type ImportResponses = {
  preview: ImportPreviewResponse
  commit: ImportCommitResponse
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isNamedReference(value: unknown): boolean {
  return value === null || (isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string')
}

function isImportIssues(value: unknown): boolean {
  return Array.isArray(value) && value.every(issue =>
    isRecord(issue) && typeof issue.field === 'string' && typeof issue.message === 'string',
  )
}

function isPreviewResponse(value: unknown): value is ImportPreviewResponse {
  return isRecord(value)
    && ['total', 'valid', 'invalid', 'duplicate'].every(key => isCount(value[key]))
    && Array.isArray(value.rows)
    && value.rows.every(row =>
      isRecord(row)
      && isCount(row.row) && row.row > 0
      && ['valid', 'invalid', 'duplicate'].includes(row.status as string)
      && typeof row.email === 'string'
      && typeof row.fullName === 'string'
      && (row.businessName === null || typeof row.businessName === 'string')
      && isNamedReference(row.customerType)
      && isNamedReference(row.zone)
      && (row.pricingMode === null || row.pricingMode === 'per_bin' || row.pricingMode === 'full_truck')
      && isImportIssues(row.issues),
    )
}

function isCommitResponse(value: unknown): value is ImportCommitResponse {
  return isRecord(value)
    && ['total', 'created', 'skipped', 'failed', 'needsBins'].every(key => isCount(value[key]))
    && Array.isArray(value.errors)
    && value.errors.every(error =>
      isRecord(error)
      && isCount(error.row) && error.row > 0
      && typeof error.email === 'string'
      && isImportIssues(error.issues),
    )
}

/** Read the body once and validate the selected import phase before exposing it to the UI. */
export async function parseImportResponse<T extends keyof ImportResponses>(res: {
  ok: boolean
  status: number
  text: () => Promise<string>
}, phase: T): Promise<{ ok: true; data: ImportResponses[T] } | { ok: false; message: string }> {
  let text: string
  try {
    text = await res.text()
  } catch {
    return { ok: false, message: 'Could not read the server response.' }
  }

  let body: unknown = null
  if (text) {
    try { body = JSON.parse(text) } catch { /* non-JSON body — handled below */ }
  }
  if (!res.ok) {
    const message = isRecord(body) && typeof body.message === 'string' ? body.message : undefined
    return { ok: false, message: mapImportFailure(res.status, message) }
  }
  if (phase === 'preview' ? isPreviewResponse(body) : isCommitResponse(body)) {
    return { ok: true, data: body as ImportResponses[T] }
  }
  return { ok: false, message: 'Received an invalid import response from the server.' }
}
