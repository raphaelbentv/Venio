export interface ApiResponse<T = unknown> {
  data?: T
  meta?: PaginationMeta
  error?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiFetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
}
