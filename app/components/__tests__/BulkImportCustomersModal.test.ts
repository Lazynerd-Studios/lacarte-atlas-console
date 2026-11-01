import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed, ref } from 'vue'
import BulkImportCustomersModal from '../BulkImportCustomersModal.vue'

enableAutoUnmount(afterEach)

const authFetch = vi.fn()
const toast = { success: vi.fn(), warning: vi.fn() }
const renderError = vi.fn()
const preview = {
  total: 1, valid: 1, invalid: 0, duplicate: 0,
  rows: [{
    row: 2, status: 'valid', email: 'customer@example.test', fullName: 'Test Customer',
    businessName: null, customerType: { id: 'type-1', name: 'Residential' },
    zone: { id: 'zone-1', name: 'Central' }, pricingMode: 'per_bin', issues: [],
  }],
}
const commit = { total: 1, created: 1, skipped: 0, failed: 0, needsBins: 1, errors: [] }

beforeEach(() => {
  vi.clearAllMocks()
  authFetch.mockReset()
  for (const [name, implementation] of Object.entries({
    ref, computed,
    useApi: () => ({ authFetch }),
    useAppToast: () => toast,
  })) vi.stubGlobal(name, implementation)
})

afterEach(() => vi.unstubAllGlobals())

function button(wrapper: VueWrapper, label: string) {
  const result = wrapper.findAll('button').find(candidate => candidate.text() === label)
  expect(result, `Expected button: ${label}`).toBeDefined()
  return result!
}

async function selectFile() {
  const wrapper = mount(BulkImportCustomersModal, {
    global: { stubs: { UIcon: true }, config: { errorHandler: renderError } },
  })
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', {
    value: [new File(['spreadsheet'], 'customers.xlsx')], configurable: true,
  })
  await input.trigger('change')
  return wrapper
}

async function validateFile(wrapper: VueWrapper) {
  await button(wrapper, 'Validate file').trigger('click')
  await flushPromises()
}

describe('BulkImportCustomersModal response handling', () => {
  it.each(['', '<html>gateway</html>', '{}', '{"valid":1}'])(
    'stays at file selection after an invalid preview response: %s', async (body) => {
      authFetch.mockResolvedValueOnce(new Response(body, { status: 200 }))
      const wrapper = await selectFile()
      await validateFile(wrapper)

      expect(authFetch).toHaveBeenCalledTimes(1)
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toMatch(/invalid.*response/i)
      expect(wrapper.find('input[type="file"]').exists()).toBe(true)
      expect(button(wrapper, 'Validate file').element.disabled).toBe(false)
      expect(wrapper.emitted('imported')).toBeUndefined()
      expect(renderError).not.toHaveBeenCalled()
    },
  )

  it('restores the validation controls when response-body reading fails', async () => {
    const response = new Response('', { status: 200 })
    vi.spyOn(response, 'text').mockRejectedValueOnce(new Error('Connection interrupted'))
    authFetch.mockResolvedValueOnce(response)
    const wrapper = await selectFile()
    await validateFile(wrapper)

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/read.*response/i)
    expect(button(wrapper, 'Validate file').element.disabled).toBe(false)
    expect(renderError).not.toHaveBeenCalled()
  })

  it.each(['', '<html>gateway</html>', '{}', '{"created":1,"errors":[]}'])(
    'does not show completion or emit success for an invalid commit: %s', async (body) => {
      authFetch
        .mockResolvedValueOnce(Response.json(preview))
        .mockResolvedValueOnce(new Response(body, { status: 200 }))
      const wrapper = await selectFile()
      await validateFile(wrapper)
      await button(wrapper, 'Import 1 customers').trigger('click')
      await flushPromises()

      expect(authFetch).toHaveBeenCalledTimes(2)
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toMatch(/check the customer list/i)
      expect(wrapper.find('input[type="file"]').exists()).toBe(true)
      expect(button(wrapper, 'Cancel').element.disabled).toBe(false)
      expect(wrapper.emitted('imported')).toBeUndefined()
      expect(toast.success).not.toHaveBeenCalled()
      expect(toast.warning).not.toHaveBeenCalled()
      expect(renderError).not.toHaveBeenCalled()
    },
  )

  it('restores the commit controls after a response-body read failure', async () => {
    const response = new Response('', { status: 200 })
    vi.spyOn(response, 'text').mockRejectedValueOnce(new Error('Connection interrupted'))
    authFetch.mockResolvedValueOnce(Response.json(preview)).mockResolvedValueOnce(response)
    const wrapper = await selectFile()
    await validateFile(wrapper)
    await button(wrapper, 'Import 1 customers').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/check the customer list/i)
    expect(button(wrapper, 'Cancel').element.disabled).toBe(false)
    expect(wrapper.emitted('imported')).toBeUndefined()
    expect(renderError).not.toHaveBeenCalled()
  })

  it('still advances through a valid preview and commit and refreshes the customer list', async () => {
    authFetch.mockResolvedValueOnce(Response.json(preview)).mockResolvedValueOnce(Response.json(commit))
    const wrapper = await selectFile()
    await validateFile(wrapper)

    expect(wrapper.text()).toContain('Test Customer')
    await button(wrapper, 'Import 1 customers').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Created 1')
    expect(button(wrapper, 'Done').exists()).toBe(true)
    expect(wrapper.emitted('imported')).toHaveLength(1)
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(renderError).not.toHaveBeenCalled()
  })
})
