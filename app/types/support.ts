// Support / Ticket Type Definitions

/** Customer information attached to a support ticket */
export interface SupportTicketCustomer {
  id: string
  name: string
  email: string
  phoneNumber: string
}

/** Support ticket returned by /support/admin/tickets */
export interface SupportTicket {
  id: string
  ticketNumber: number
  ticketId: string
  subject: string
  category: SupportTicketCategory
  priority: SupportTicketPriority
  status: SupportTicketStatus
  createdAt: string | null
  updatedAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  customer: SupportTicketCustomer
}

/** Support ticket status values accepted by the API */
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

/** Support ticket priority values accepted by the API */
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent'

/** Support ticket category values accepted by the API */
export type SupportTicketCategory =
  | 'missed_pickup'
  | 'billing'
  | 'service_request'
  | 'equipment_issue'
  | 'schedule_change'
  | 'other'

/** High-level support metrics returned by /support/admin/tickets/stats */
export interface TicketStats {
  openTickets: number
  inProgressTickets: number
  resolvedToday: number
  avgResponseHours: number
}

/** Pagination metadata returned by list endpoints */
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** Paginated list response for /support/admin/tickets */
export interface TicketListResponse {
  data: SupportTicket[]
  pagination: Pagination
}
