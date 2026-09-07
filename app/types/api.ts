// Shared API response types. Consume these instead of defining ad-hoc
// response interfaces in every page.

/** Generic API success envelope */
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

/** Standard pagination metadata */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** Paginated list response (wraps data + pagination at top level) */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/** Response where data + pagination are nested inside a data property */
export interface PaginatedDataResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/** Simple success response used for create/update/delete operations */
export interface SuccessResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

/** Error response shape returned by the backend */
export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}
