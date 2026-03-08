<script setup lang="ts">
const props = defineProps<{
  ticket: {
    id: string
    subject: string
    customer: string
    email: string
    category: string
    priority: string
    status: string
    created: string
    phone?: string
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update', id: string, status: string): void
}>()

const reply = ref('')
const newStatus = ref(props.ticket.status)

const messages = ref([
  {
    author: props.ticket.customer,
    initials: props.ticket.customer.split(' ').map((n: string) => n[0]).join(''),
    avatarBg: '#eff6ff',
    avatarColor: '#3b82f6',
    time: props.ticket.created,
    text: 'Hello, my waste bin was not picked up this morning as scheduled. My pickup was supposed to happen at 8 AM. Can someone please help?',
    isStaff: false,
  },
])

function sendReply() {
  if (!reply.value.trim()) return
  messages.value.push({
    author: 'Admin',
    initials: 'A',
    avatarBg: '#fff9e6',
    avatarColor: '#ffb400',
    time: new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    text: reply.value.trim(),
    isStaff: true,
  })
  emit('update', props.ticket.id, newStatus.value)
  reply.value = ''
}

function priorityStyle(p: string) {
  if (p === 'urgent') return { bg: '#fef2f2', color: '#dc2626' }
  if (p === 'high')   return { bg: '#fff7ed', color: '#ea580c' }
  if (p === 'medium') return { bg: '#fff9e6', color: '#ffb400' }
  return                     { bg: '#f9fafb', color: '#6b7280' }
}

function statusStyle(s: string) {
  if (s === 'open')        return { bg: '#e5e7eb',             border: '#e5e7eb',             color: '#6b7280' }
  if (s === 'in-progress') return { bg: 'rgba(255,180,0,0.1)', border: 'rgba(255,180,0,0.2)', color: '#d49a00' }
  if (s === 'resolved')    return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e' }
  return                          { bg: 'white',               border: '#ececec',             color: '#1a1a1a' }
}

function statusLabel(s: string) {
  if (s === 'in-progress') return 'In Progress'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
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
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ ticket.id }} · Created {{ ticket.created }}</p>
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
                <p style="font-size:16px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ ticket.customer }}</p>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;border-radius:20px;background:#f9fafb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <UIcon name="i-lucide-mail" style="width:20px;height:20px;color:#6b7280" />
              </div>
              <div>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 2px">Email</p>
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ ticket.email }}</p>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;border-radius:20px;background:#f9fafb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <UIcon name="i-lucide-phone" style="width:20px;height:20px;color:#6b7280" />
              </div>
              <div>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 2px">Phone</p>
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ ticket.phone || '(555) 123-4567' }}</p>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;border-radius:20px;background:#f9fafb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <UIcon name="i-lucide-tag" style="width:20px;height:20px;color:#6b7280" />
              </div>
              <div>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 2px">Category</p>
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ ticket.category }}</p>
              </div>
            </div>

          </div>
        </div>

        <!-- Conversation -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <p style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Conversation</p>

          <div v-for="(msg, i) in messages" :key="i" style="display:flex;gap:12px;align-items:flex-start">
            <div :style="`width:40px;height:40px;border-radius:20px;background:${msg.avatarBg};display:flex;align-items:center;justify-content:center;flex-shrink:0`">
              <span :style="`font-size:16px;font-weight:500;color:${msg.avatarColor};font-family:'Manrope',sans-serif`">{{ msg.initials }}</span>
            </div>
            <div style="flex:1;background:#f9fafb;border-radius:16px;padding:16px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ msg.author }}</span>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ msg.time }}</span>
              </div>
              <p style="font-size:14px;color:#111;font-family:'Manrope',sans-serif;line-height:1.6;margin:0">{{ msg.text }}</p>
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

          <div style="display:flex;align-items:center;justify-content:space-between">
            <!-- Attach file (decorative) -->
            <button
              style="height:32px;padding:0 12px;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;border-radius:20px"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
            >
              <UIcon name="i-lucide-paperclip" style="width:16px;height:16px;color:#6b7280" />
              Attach File
            </button>

            <div style="display:flex;align-items:center;gap:8px">
              <!-- Status change -->
              <select
                v-model="newStatus"
                :style="`height:42px;padding:0 32px 0 14px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 10px center;min-width:150px`"
              >
                <option value="open">Mark Open</option>
                <option value="in-progress">Mark In Progress</option>
                <option value="resolved">Mark Resolved</option>
                <option value="closed">Mark Closed</option>
              </select>

              <!-- Send -->
              <button
                :style="`height:42px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(255,180,0,0.2);opacity:${reply.trim() ? '1' : '0.5'}`"
                :disabled="!reply.trim()"
                @click="sendReply"
              >
                <UIcon name="i-lucide-send" style="width:16px;height:16px;color:white" />
                Send Reply
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
