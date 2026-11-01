import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { computed, onMounted, ref, watch } from 'vue'
import { createMemoryHistory, createRouter, useRoute, useRouter } from 'vue-router'
import CustomersPage from '../index.vue'

enableAutoUnmount(afterEach)

const api = {
  get: vi.fn(),
  request: vi.fn(),
}

beforeEach(() => {
  api.get.mockReset().mockResolvedValue({ data: [], pagination: { total: 0 } })
  api.request.mockReset().mockResolvedValue({
    registered: 1, profile_incomplete: 1, not_priced: 1,
    ready_to_order: 1, active: 1, onboarded: 1, total: 6,
  })
  for (const [name, implementation] of Object.entries({
    ref, computed, watch, onMounted, useRoute, useRouter,
    definePageMeta: () => {},
    useApi: () => api,
    useAppToast: () => ({ error: vi.fn(), success: vi.fn() }),
    usePermissions: () => ({ hasPermission: () => true }),
  })) vi.stubGlobal(name, implementation)
})

afterEach(() => vi.unstubAllGlobals())

async function openPage(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/customers', component: CustomersPage }],
  })
  await router.push(url)
  await router.isReady()
  const wrapper = mount(CustomersPage, {
    global: {
      plugins: [router],
      stubs: {
        UIcon: true, NuxtLink: true, PageSkeleton: true, AppPagination: true,
        LazyCustomerModal: true, LazyBulkImportCustomersModal: true,
        LazySuspendModal: true, LazyConfirmDialog: true,
      },
    },
  })
  await flushPromises()
  return { wrapper, router }
}

function lastListQuery() {
  const requests = api.get.mock.calls
    .map(([path]) => new URL(path, 'https://example.test'))
    .filter(url => url.searchParams.get('limit') === '20')
  expect(requests.length).toBeGreaterThan(0)
  return requests.at(-1)!.searchParams
}

describe('customer onboarding filters', () => {
  it('applies both documented filters when opening an upsell deep link', async () => {
    const { wrapper } = await openPage('/customers?onboardingStage=ready_to_order&subscribed=false')

    expect(lastListQuery().get('onboardingStage')).toBe('ready_to_order')
    expect(lastListQuery().get('subscribed')).toBe('false')
    expect(wrapper.get('[title="Clear stage filter"]').text()).toContain('Ready to order')
  })

  it('writes tile selections to the URL without losing other query parameters or the hash', async () => {
    const { wrapper, router } = await openPage('/customers?subscribed=false&source=triage#list')

    await wrapper.get('[title="Filter list: Ready to order"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({
      onboardingStage: 'ready_to_order', subscribed: 'false', source: 'triage',
    })
    expect(router.currentRoute.value.hash).toBe('#list')
    expect(lastListQuery().get('onboardingStage')).toBe('ready_to_order')
  })

  it('removes a stage from the URL and request when its tile is toggled off', async () => {
    const { wrapper, router } = await openPage('/customers?onboardingStage=active&subscribed=false')

    await wrapper.get('[title="Clear stage filter"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.onboardingStage).toBeUndefined()
    expect(router.currentRoute.value.query.subscribed).toBe('false')
    expect(lastListQuery().has('onboardingStage')).toBe(false)
  })

  it('keeps the subscription toggle in the URL without clearing the stage', async () => {
    const { wrapper, router } = await openPage('/customers?onboardingStage=ready_to_order')
    const toggle = wrapper.findAll('button').find(button => button.text() === 'No active subscription')!

    await toggle.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.subscribed).toBe('false')
    expect(router.currentRoute.value.query.onboardingStage).toBe('ready_to_order')
    expect(lastListQuery().get('subscribed')).toBe('false')

    await toggle.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.subscribed).toBeUndefined()
    expect(lastListQuery().has('subscribed')).toBe(false)
  })

  it('updates the mounted page when query-only navigation changes or clears filters', async () => {
    const { wrapper, router } = await openPage('/customers?onboardingStage=registered')

    await router.push('/customers?onboardingStage=onboarded&subscribed=false')
    await flushPromises()
    expect(lastListQuery().get('onboardingStage')).toBe('onboarded')
    expect(lastListQuery().get('subscribed')).toBe('false')
    expect(wrapper.get('[title="Clear stage filter"]').text()).toContain('Onboarded')

    await router.push('/customers')
    await flushPromises()
    expect(lastListQuery().has('onboardingStage')).toBe(false)
    expect(lastListQuery().has('subscribed')).toBe(false)
    expect(wrapper.find('[title="Clear stage filter"]').exists()).toBe(false)
  })

  it.each([
    'onboardingStage=unknown',
    'onboardingStage=',
    'onboardingStage=active&onboardingStage=registered',
  ])('ignores an invalid or ambiguous stage: %s', async (query) => {
    const { wrapper } = await openPage(`/customers?${query}&subscribed=false`)
    expect(lastListQuery().has('onboardingStage')).toBe(false)
    expect(lastListQuery().get('subscribed')).toBe('false')
    expect(wrapper.find('[title="Clear stage filter"]').exists()).toBe(false)
  })
})
