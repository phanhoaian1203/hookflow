export interface ApiResponse<T> {
  success: boolean
  data: T | null
  message: string
  errors: string[] | null
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface SelectOption {
  value: string
  label: string
}

export interface User {
  id: string
  fullName: string
  email: string
  role: 'User' | 'Admin'
  createdAt: string
}
