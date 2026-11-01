import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import TrackingPage from '../index.vue'

enableAutoUnmount(afterEach)

const authFetch = vi.fn()
const get = vi.fn()

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  authFetch.mockReset()
  get.mockReset().mockResolvedValue({ data: [] })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  for (const [name, implementation] of Object.entries({
    ref, computed, onMounted, onUnmounted,
    definePageMeta: () => {},
    useRuntimeConfig: () => ({ public: { tomtomApiKey: '' } }),
    useAuthStore: () => ({ token: 'test-token' }),
    useApi: () => ({ get, authFetch }),
  })) vi.stubGlobal(name, implementation)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function createStream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const cancel = vi.fn()
  const stream = new ReadableStream<Uint8Array>({
    start(value) { controller = value },
    cancel,
  })
  return {
    controller,
    cancel,
    response: new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
  }
}

async function openPage() {
  const wrapper = mount(TrackingPage, { global: { stubs: { UIcon: true } } })
  await flushPromises()
  return wrapper
}

describe('tracking stream lifecycle', () => {
  it('marks clean EOF disconnected and enables reconnect', async () => {
    const first = createStream()
    const second = createStream()
    authFetch.mockResolvedValueOnce(first.response).mockResolvedValueOnce(second.response)
    const wrapper = await openPage()

    expect(wrapper.get('.reconnect-btn').text()).toBe('Connected')
    expect(wrapper.get<HTMLButtonElement>('.reconnect-btn').element.disabled).toBe(true)

    first.controller.close()
    await flushPromises()

    expect(wrapper.get('.reconnect-btn').text()).toBe('Reconnect')
    expect(wrapper.get<HTMLButtonElement>('.reconnect-btn').element.disabled).toBe(false)
    expect(wrapper.text()).toContain('Disconnected')
    expect(wrapper.text()).toMatch(/stream ended/i)
    expect(first.response.body!.locked).toBe(false)

    await wrapper.get('.reconnect-btn').trigger('click')
    await flushPromises()
    await vi.advanceTimersByTimeAsync(1000)
    expect(authFetch).toHaveBeenCalledTimes(2)
    expect(wrapper.get('.reconnect-btn').text()).toBe('Connected')
    expect(wrapper.text()).not.toMatch(/stream ended/i)
    second.controller.close()
    await flushPromises()
  })

  it('releases the reader and allows reconnect after a stream read failure', async () => {
    const stream = createStream()
    authFetch.mockResolvedValueOnce(stream.response)
    const wrapper = await openPage()
    stream.controller.error(new Error('Connection interrupted'))
    await flushPromises()

    expect(wrapper.get<HTMLButtonElement>('.reconnect-btn').element.disabled).toBe(false)
    expect(wrapper.text()).toContain('Lost connection to tracking stream')
    expect(stream.response.body!.locked).toBe(false)
  })

  it.each([401, 503])('stays disconnected when the stream endpoint returns HTTP %i', async (status) => {
    authFetch.mockResolvedValueOnce(new Response(null, { status }))
    const wrapper = await openPage()

    expect(wrapper.text()).toContain(`Failed to connect to tracking stream (${status})`)
    expect(wrapper.get<HTMLButtonElement>('.reconnect-btn').element.disabled).toBe(false)
  })

  it('stays disconnected when the response has no readable body', async () => {
    authFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))
    const wrapper = await openPage()

    expect(wrapper.text()).toContain('Failed to read tracking stream')
    expect(wrapper.get<HTMLButtonElement>('.reconnect-btn').element.disabled).toBe(false)
  })

  it('reports a connection failure before response headers arrive', async () => {
    authFetch.mockRejectedValueOnce(new Error('Network unavailable'))
    const wrapper = await openPage()

    expect(wrapper.text()).toContain('Lost connection to tracking stream')
    expect(wrapper.get<HTMLButtonElement>('.reconnect-btn').element.disabled).toBe(false)
  })

  it.each(['HTTP failure', 'network failure', 'clean EOF'])(
    'ignores a replaced connection finishing with %s', async (outcome) => {
      let resolveOld!: (response: Response) => void
      let rejectOld!: (error: Error) => void
      const pending = new Promise<Response>((resolve, reject) => {
        resolveOld = resolve
        rejectOld = reject
      })
      const current = createStream()
      authFetch.mockReturnValueOnce(pending).mockResolvedValueOnce(current.response)
      const wrapper = await openPage()
      const oldSignal = authFetch.mock.calls[0]![1].signal as AbortSignal

      await wrapper.get('.reconnect-btn').trigger('click')
      await flushPromises()
      await vi.advanceTimersByTimeAsync(1000)
      expect(oldSignal.aborted).toBe(true)
      expect(wrapper.get('.reconnect-btn').text()).toBe('Connected')

      if (outcome === 'network failure') rejectOld(new Error('Old connection failed'))
      else if (outcome === 'HTTP failure') resolveOld(new Response(null, { status: 503 }))
      else {
        const old = createStream()
        old.controller.close()
        resolveOld(old.response)
      }
      await flushPromises()

      expect(wrapper.get('.reconnect-btn').text()).toBe('Connected')
      expect(wrapper.get<HTMLButtonElement>('.reconnect-btn').element.disabled).toBe(true)
      expect(wrapper.text()).not.toContain('Lost connection to tracking stream')
      expect(wrapper.text()).not.toContain('Failed to connect to tracking stream')
      expect(wrapper.text()).not.toMatch(/stream ended/i)
      current.controller.close()
      await flushPromises()
    },
  )

  it('aborts the active request on unmount and ignores its later completion', async () => {
    const stream = createStream()
    authFetch.mockResolvedValueOnce(stream.response)
    const wrapper = await openPage()
    const signal = authFetch.mock.calls[0]![1].signal as AbortSignal

    wrapper.unmount()
    expect(signal.aborted).toBe(true)
    stream.controller.close()
    await flushPromises()

    expect(console.error).not.toHaveBeenCalled()
    expect(stream.response.body!.locked).toBe(false)
  })
})
