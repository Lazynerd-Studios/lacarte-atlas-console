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

  const preview = {
    total: 1, valid: 1, invalid: 0, duplicate: 0,
    rows: [{
      row: 2, status: 'valid', email: 'customer@example.test', fullName: 'Test Customer',
      businessName: null, customerType: { id: 'type-1', name: 'Residential' },
      zone: { id: 'zone-1', name: 'Central' }, pricingMode: 'per_bin', issues: [],
    }],
  }
  const commit = { total: 1, created: 1, skipped: 0, failed: 0, needsBins: 1, errors: [] }

  it('accepts a complete preview response', async () => {
    const res = await parseImportResponse(fakeRes(200, true, JSON.stringify(preview)), 'preview')
    expect(res).toEqual({ ok: true, data: preview })
  })

  it('accepts invalid and duplicate preview rows with nullable unresolved fields', async () => {
    const data = {
      total: 2, valid: 0, invalid: 1, duplicate: 1,
      rows: ['invalid', 'duplicate'].map((status, index) => ({
        ...preview.rows[0], row: index + 2, status, customerType: null, zone: null,
        pricingMode: null, issues: [{ field: 'email', message: 'Check this address' }],
      })),
    }
    expect(await parseImportResponse(fakeRes(200, true, JSON.stringify(data)), 'preview'))
      .toEqual({ ok: true, data })
  })

  it('accepts a complete commit response', async () => {
    expect(await parseImportResponse(fakeRes(201, true, JSON.stringify(commit)), 'commit'))
      .toEqual({ ok: true, data: commit })
  })

  it('accepts a commit with failed rows and field-level issues', async () => {
    const data = {
      ...commit, created: 0, failed: 1, needsBins: 0,
      errors: [{ row: 2, email: 'customer@example.test', issues: [{ field: 'zone', message: 'Inactive zone' }] }],
    }
    expect(await parseImportResponse(fakeRes(200, true, JSON.stringify(data)), 'commit'))
      .toEqual({ ok: true, data })
  })

  it('uses the server message on 4xx when provided', async () => {
    const res = await parseImportResponse(fakeRes(400, false, '{"message":"Only 100 rows allowed"}'), 'preview')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Only 100 rows allowed')
  })

  it('falls back to mapped copy for a non-JSON error body', async () => {
    const res = await parseImportResponse(fakeRes(422, false, '<html>gateway</html>'), 'preview')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Upload a valid .xlsx under 1 MB.')
  })

  it.each(['', '   ', '<html>gateway</html>', '{', 'null', '[]', 'true', '12', '"text"', '{}'])(
    'rejects an empty, malformed, or non-object success body: %s', async (body) => {
      for (const phase of ['preview', 'commit'] as const) {
        const res = await parseImportResponse(fakeRes(200, true, body), phase)
        expect(res.ok).toBe(false)
        if (!res.ok) expect(res.message).toMatch(/invalid.*response/i)
      }
    },
  )

  it.each([
    { total: '1' }, { valid: -1 }, { invalid: 0.5 }, { duplicate: null }, { rows: {} },
    { rows: [null] }, { rows: [{ row: 2 }] },
    { rows: [{ ...preview.rows[0], issues: null }] },
    { rows: [{ ...preview.rows[0], issues: [{ field: 'email' }] }] },
    { rows: [{ ...preview.rows[0], status: 'unexpected' }] },
    { rows: [{ ...preview.rows[0], row: 0 }] },
    { rows: [{ ...preview.rows[0], email: 1 }] },
    { rows: [{ ...preview.rows[0], fullName: null }] },
    { rows: [{ ...preview.rows[0], businessName: {} }] },
    { rows: [{ ...preview.rows[0], customerType: { id: 'type-1' } }] },
    { rows: [{ ...preview.rows[0], zone: [] }] },
    { rows: [{ ...preview.rows[0], pricingMode: 'unknown' }] },
  ])('rejects incorrectly typed preview fields: %j', async (patch) => {
    const res = await parseImportResponse(fakeRes(200, true, JSON.stringify({ ...preview, ...patch })), 'preview')
    expect(res.ok).toBe(false)
  })

  it.each([
    { total: null }, { created: '1' }, { skipped: -1 }, { failed: 0.5 }, { needsBins: undefined },
    { errors: null }, { errors: [null] }, { errors: [{ row: 2 }] },
    { errors: [{ row: 0, email: 'a@example.test', issues: [] }] },
    { errors: [{ row: 2, email: 5, issues: [] }] },
    { errors: [{ row: 2, email: 'a@example.test', issues: [{ field: 'email', message: null }] }] },
  ])('rejects incorrectly typed commit fields: %j', async (patch) => {
    const res = await parseImportResponse(fakeRes(200, true, JSON.stringify({ ...commit, ...patch })), 'commit')
    expect(res.ok).toBe(false)
  })

  it('does not accept the response shape for the other import phase', async () => {
    expect((await parseImportResponse(fakeRes(200, true, JSON.stringify(commit)), 'preview')).ok).toBe(false)
    expect((await parseImportResponse(fakeRes(200, true, JSON.stringify(preview)), 'commit')).ok).toBe(false)
  })

  it('returns a recoverable error when reading the response body fails', async () => {
    const res = await parseImportResponse({
      ok: true, status: 200, text: async () => { throw new Error('Connection interrupted') },
    }, 'preview')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toMatch(/read.*response/i)
  })
})
