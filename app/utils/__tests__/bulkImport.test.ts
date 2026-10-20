// Customer bulk import — pure helper coverage (frontend-web-customer-bulk-import.md §2/§5/§6)
// **Validates: file guards, 4xx UI mapping, commit gate, template filename, row tones**
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  IMPORT_MAX_BYTES,
  validateImportFile,
  mapImportFailure,
  canCommitImport,
  templateFilename,
  importRowTone,
  parseImportResponse,
} from '~/utils/bulkImport'

describe('validateImportFile', () => {
  it('accepts a .xlsx file within the size limit', () => {
    expect(validateImportFile({ name: 'customers.xlsx', size: 1024 })).toBeNull()
    expect(validateImportFile({ name: 'UPPER.XLSX', size: 1024 })).toBeNull()
  })

  it('rejects non-xlsx files', () => {
    expect(validateImportFile({ name: 'customers.csv', size: 10 })).toContain('xlsx')
    expect(validateImportFile({ name: 'customers.xls', size: 10 })).toContain('xlsx')
    expect(validateImportFile({ name: 'no-extension', size: 10 })).toContain('xlsx')
  })

  it('rejects files over 1 MB and empty files', () => {
    expect(validateImportFile({ name: 'a.xlsx', size: IMPORT_MAX_BYTES + 1 })).toContain('1 MB')
    expect(validateImportFile({ name: 'a.xlsx', size: 0 })).toContain('empty')
  })

  it('Property: any size strictly above the limit is rejected, at or below accepted', () => {
    const sizeArb = fc.integer({ min: 1, max: 10_000_000 })
    fc.assert(
      fc.property(sizeArb, (size) => {
        const result = validateImportFile({ name: 'sheet.xlsx', size })
        if (size > IMPORT_MAX_BYTES) expect(result).not.toBeNull()
        else expect(result).toBeNull()
      }),
      { numRuns: 100 },
    )
  })
})

describe('mapImportFailure', () => {
  it('maps 422/400/403 to the doc UI copy when the server sent no message', () => {
    expect(mapImportFailure(422)).toBe('Upload a valid .xlsx under 1 MB.')
    expect(mapImportFailure(400)).toContain('nothing was created')
    expect(mapImportFailure(403)).toContain('permission')
  })

  it('prefers the server message when present', () => {
    expect(mapImportFailure(400, 'Too many rows: 150 > 100')).toBe('Too many rows: 150 > 100')
  })

  it('Property: any unhandled status still yields a non-empty message mentioning nothing-created', () => {
    const statusArb = fc.integer({ min: 400, max: 599 }).filter(s => ![400, 403, 422].includes(s))
    fc.assert(
      fc.property(statusArb, (status) => {
        const msg = mapImportFailure(status)
        expect(msg.length).toBeGreaterThan(0)
        expect(msg).toContain(String(status))
        expect(msg).toContain('nothing was created')
      }),
      { numRuns: 50 },
    )
  })
})

describe('canCommitImport', () => {
  it('is false without a preview or with zero valid rows', () => {
    expect(canCommitImport(null)).toBe(false)
    expect(canCommitImport({ valid: 0 })).toBe(false)
  })
  it('is true with at least one valid row', () => {
    expect(canCommitImport({ valid: 1 })).toBe(true)
  })
})

describe('templateFilename', () => {
  it('extracts the quoted filename from Content-Disposition', () => {
    expect(templateFilename('attachment; filename="customer-import-template.xlsx"')).toBe('customer-import-template.xlsx')
  })
  it('falls back to the default name when absent', () => {
    expect(templateFilename(null)).toBe('customer-import-template.xlsx')
    expect(templateFilename('attachment')).toBe('customer-import-template.xlsx')
  })
})

describe('importRowTone', () => {
  it('renders green/red/grey per doc §3', () => {
    expect(importRowTone('valid').label).toBe('Ready')
    expect(importRowTone('invalid').label).toBe('Fix')
    expect(importRowTone('duplicate').label).toBe('Duplicate')
    expect(importRowTone('valid').bg).toBe('#dcfce7')
    expect(importRowTone('invalid').fg).toBe('#ef4444')
    expect(importRowTone('duplicate').bg).toBe('#f3f4f6')
  })
})

describe('parseImportResponse', () => {
  function fakeRes(status: number, ok: boolean, body: string) {
    return { ok, status, text: async () => body }
  }

  it('passes through parsed JSON on success', async () => {
    const res = await parseImportResponse<{ total: number }>(fakeRes(200, true, '{"total":3}'))
    expect(res).toEqual({ ok: true, data: { total: 3 } })
  })

  it('uses the server message on 4xx when provided', async () => {
    const res = await parseImportResponse<{ total: number }>(fakeRes(400, false, '{"message":"Only 100 rows allowed"}'))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Only 100 rows allowed')
  })

  it('falls back to mapped copy for a non-JSON error body', async () => {
    const res = await parseImportResponse(fakeRes(422, false, '<html>gateway</html>'))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Upload a valid .xlsx under 1 MB.')
  })

  it('treats an empty 2xx body as success with an empty object', async () => {
    const res = await parseImportResponse(fakeRes(200, true, ''))
    expect(res).toEqual({ ok: true, data: {} })
  })
})
