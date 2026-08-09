import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'Delete Item', message: 'Are you sure?' },
    })
    expect(wrapper.text()).toContain('Delete Item')
    expect(wrapper.text()).toContain('Are you sure?')
  })

  it('renders custom confirm text', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'T', message: 'M', confirmText: 'Yes, Delete' },
    })
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons[buttons.length - 1]
    expect(confirmBtn!.text()).toContain('Yes, Delete')
  })

  it('renders custom cancel text', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'T', message: 'M', cancelText: 'Go Back' },
    })
    expect(wrapper.text()).toContain('Go Back')
  })

  it('shows loading spinner when loading=true', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'T', message: 'M', loading: true, confirmText: 'Approve' },
    })
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons[buttons.length - 1]
    expect(confirmBtn!.text()).toContain('Approve')
  })

  it('disables buttons when loading', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'T', message: 'M', loading: true },
    })
    const buttons = wrapper.findAll('button')
    buttons.forEach(btn => expect(btn.element.disabled).toBe(true))
  })

  it('emits confirm when confirm button clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'T', message: 'M' },
    })
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1]!.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel when cancel button clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'T', message: 'M' },
    })
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit confirm when loading', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'T', message: 'M', loading: true },
    })
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1]!.trigger('click')
    expect(wrapper.emitted('confirm')).toBeFalsy()
  })
})
