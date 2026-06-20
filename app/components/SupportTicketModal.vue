<script setup lang="ts">
import type { SupportTicket, SupportTicketDetail, SupportTicketMessage, SupportTicketStatus } from '~/types/support'

const props = defineProps<{
  ticket: SupportTicket
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update', id: string, status: string): void
}>()

const api = useApi()

const detail = ref<SupportTicketDetail | null>(null)
const loading = ref(false)
const reply = ref('')
const newStatus = ref(apiStatusToModal(props.ticket.status))
const sending = ref(false)

const ticket = computed(() => detail.value ?? props.ticket)

const customerName = computed(() => ticket.value.customer?.name ?? 'Unknown')
const customerEmail = computed(() => ticket.value.customer?.email ?? '')
const customerPhone = computed(() => ticket.value.customer?.phoneNumber ?? '')
const createdAt = computed(() => formatTicketDate(ticket.value.createdAt))

const messages = computed<SupportTicketMessage[]>(() => {
  if (!detail.value?.messages || detail.value.messages.length === 0) return []
  return detail.value.messages
})

function apiStatusToModal(status: string): string {
  return status === 'in_progress' ? 'in-progress' : status
}

function modalStatusToApi(status: string): SupportTicketStatus {
  return (status === 'in-progress' ? 'in_progress' : status) as SupportTicketStatus
}

function formatTicketDate(dateString: string | null): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatMessageTime(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function categoryLabel(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function authorInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function isStaffMessage(message: SupportTicketMessage): boolean {
  return message.authorType === 'staff' || message.authorType === 'admin'
}

function avatarStyle(message: SupportTicketMessage) {
  return isStaffMessage(message)
    ? { bg: '#fff9e6', color: '#ffb400' }
    : { bg: '#eff6ff', color: '#3b82f6' }
}

async function fetchTicketDetail(silent = false) {
  if (!silent) loading.value = true
  const data = await api.get<SupportTicketDetail>(`/support/admin/tickets/${props.ticket.id}`, 'Failed to load ticket details')
  if (data) {
    detail.value = data
    newStatus.value = apiStatusToModal(data.status)
  }
  if (!silent) loading.value = false
}

async function updateStatus() {
  const previousStatus = ticket.value.status
  const apiStatus = modalStatusToApi(newStatus.value)
  const result = await api.patch<SupportTicket>(
    `/support/admin/tickets/${ticket.value.id}/status`,
    { status: apiStatus },
    'Failed to update ticket status'
  )
  if (result) {
    if (detail.value) detail.value.status = apiStatus
    emit('update', ticket.value.id, apiStatus)
  } else {
    // Revert on failure to keep UI in sync with server
    newStatus.value = apiStatusToModal(previousStatus)
  }
}

async function sendReply() {
  if (!reply.value.trim() || sending.value) return

  sending.value = true
  try {
    const result = await api.post<SupportTicketMessage>(
      `/support/admin/tickets/${ticket.value.id}/messages`,
      {
        message: reply.value.trim(),
        status: modalStatusToApi(newStatus.value),
      },
      'Failed to send reply'
    )

    if (result) {
      reply.value = ''
      emit('update', ticket.value.id, modalStatusToApi(newStatus.value))
      await fetchTicketDetail(true)
    }
  } finally {
    sending.value = false
  }
}

function priorityStyle(p: string) {
  if (p === 'urgent') return { bg: '#fef2f2', color: '#dc2626' }
  if (p === 'high')   return { bg: '#fff7ed', color: '#ea580c' }
  if (p === 'medium') return { bg: '#fff9e6', color: '#ffb400' }
  return                     { bg: '#f9fafb', color: '#6b7280' }
}

function statusStyle(s: string) {
  if (s === 'open')        return { bg: '#e5e7eb',             border: '#e5e7eb',             color: '#6b7280' }
  if (s === 'in-progress' || s === 'in_progress') return { bg: 'rgba(255,180,0,0.1)', border: 'rgba(255,180,0,0.2)', color: '#d49a00' }
  if (s === 'resolved')    return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e' }
  return                          { bg: 'white',               border: '#ececec',             color: '#1a1a1a' }
}

function statusLabel(s: string) {
  if (s === 'in_progress' || s === 'in-progress') return 'In Progress'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

onMounted(() => {
  fetchTicketDetail()
})
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative;overflow:hidden">

      <!-- Header -->
      <div style="padding:29px 24px 16px;flex-shrink:0;border-bottom:1px solid #e5e7eb">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0">
            <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0;line-height:1.4">{{ ticket.subject }}</p>
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ ticket.ticketId }} · Created {{ createdAt }}</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 11px;background:${statusStyle(ticket.status).bg};border:1px solid ${statusStyle(ticket.status).border};color:${statusStyle(ticket.status).color};white-space:nowrap`">
              {{ statusLabel(ticket.status) }}
            </span>
            <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:16px;padding:4px 8px;background:${priorityStyle(ticket.priority).bg};color:${priorityStyle(ticket.priority).color};white-space:nowrap`">
              {{ ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Close button -->
      <button
        style="position:absolute;top:12px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Scrollable body -->
      <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:24px">

        <!-- Loading -->
        <div v-if="loading" style="padding:24px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">
          Loading ticket details...
        </div>

        <template v-else>
          <!-- Customer Information -->
          <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <p style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 12px">Customer Information</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:20px;background:#f9fafb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <UIcon name="i-lucide-user" style="width:20px;height:20px;color:#6b7280" />
                </div>
                <div>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 2px">Name</p>
                  <p style="font-size:16px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ customerName }}</p>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:20px;background:#f9fafb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <UIcon name="i-lucide-mail" style="width:20px;height:20px;color:#6b7280" />
                </div>
                <div>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 2px">Email</p>
                  <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ customerEmail || '—' }}</p>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:20px;background:#f9fafb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <UIcon name="i-lucide-phone" style="width:20px;height:20px;color:#6b7280" />
                </div>
                <div>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 2px">Phone</p>
                  <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ customerPhone || '—' }}</p>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:20px;background:#f9fafb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <UIcon name="i-lucide-tag" style="width:20px;height:20px;color:#6b7280" />
                </div>
                <div>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 2px">Category</p>
                  <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ categoryLabel(ticket.category) }}</p>
                </div>
              </div>

            </div>
          </div>

          <!-- Conversation -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Conversation</p>

            <div v-if="messages.length === 0" style="padding:16px;background:#f9fafb;border-radius:16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center">
              No messages yet.
            </div>

            <div v-for="msg in messages" :key="msg.id" style="display:flex;gap:12px;align-items:flex-start">
              <div :style="`width:40px;height:40px;border-radius:20px;background:${avatarStyle(msg).bg};display:flex;align-items:center;justify-content:center;flex-shrink:0`">
                <span :style="`font-size:16px;font-weight:500;color:${avatarStyle(msg).color};font-family:'Manrope',sans-serif`">{{ authorInitials(msg.authorName) }}</span>
              </div>
              <div style="flex:1;background:#f9fafb;border-radius:16px;padding:16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ msg.authorName }}</span>
                  <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ formatMessageTime(msg.createdAt) }}</span>
                </div>
                <p style="font-size:14px;color:#111;font-family:'Manrope',sans-serif;line-height:1.6;margin:0;white-space:pre-wrap">{{ msg.message }}</p>
              </div>
            </div>
          </div>

          <!-- Send Reply -->
          <div style="display:flex;flex-direction:column;gap:12px">
            <p style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Send Reply</p>

            <textarea
              v-model="reply"
              placeholder="Type your response here..."
              rows="4"
              style="width:100%;padding:12px 16px;background:white;border:1px solid #ececec;border-radius:20px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.6"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#ececec'"
            />

            <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
              <!-- Status change -->
              <select
                v-model="newStatus"
                :style="`height:42px;padding:0 32px 0 14px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 10px center;min-width:150px`"
                @change="updateStatus"
              >
                <option value="open">Mark Open</option>
                <option value="in-progress">Mark In Progress</option>
                <option value="resolved">Mark Resolved</option>
                <option value="closed">Mark Closed</option>
              </select>

              <!-- Send -->
              <button
                :style="`height:42px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(255,180,0,0.2);opacity:${reply.trim() && !sending ? '1' : '0.5'}`"
                :disabled="!reply.trim() || sending"
                @click="sendReply"
              >
                <UIcon v-if="!sending" name="i-lucide-send" style="width:16px;height:16px;color:white" />
                <span v-else style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:white;border-radius:50%;display:inline-block;animation:spin 1s linear infinite"></span>
                {{ sending ? 'Sending...' : 'Send Reply' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
