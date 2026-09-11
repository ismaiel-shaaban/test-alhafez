import { apiRequest, Pagination } from '../api-client'

// Supervisor interfaces
export interface Supervisor {
  id: number
  name: string
  username: string
  email: string
  phone: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface SupervisorsResponse {
  supervisors: Supervisor[]
  pagination: Pagination
}

export interface CreateSupervisorRequest {
  name: string
  username: string
  email: string
  phone: string
  password: string
  is_active: boolean
}

export interface UpdateSupervisorRequest {
  name?: string
  username?: string
  email?: string
  phone?: string
  password?: string
  is_active?: boolean
}

// Supervisors API
export const getSupervisors = async (
  params?: {
    is_active?: boolean
    search?: string
    page?: number
    per_page?: number
  },
  locale?: string
): Promise<SupervisorsResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString())

  const endpoint = `/api/supervisors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return apiRequest<SupervisorsResponse>(endpoint, { locale })
}

export const getSupervisor = async (
  id: number,
  locale?: string
): Promise<Supervisor> => {
  return apiRequest<Supervisor>(`/api/supervisors/${id}`, { locale })
}

export const createSupervisor = async (
  data: CreateSupervisorRequest,
  locale?: string
): Promise<Supervisor> => {
  return apiRequest<Supervisor>('/api/supervisors', {
    method: 'POST',
    body: data,
    locale,
  })
}

export const updateSupervisor = async (
  id: number,
  data: UpdateSupervisorRequest,
  locale?: string
): Promise<Supervisor> => {
  return apiRequest<Supervisor>(`/api/supervisors/${id}`, {
    method: 'PUT',
    body: data,
    locale,
  })
}

export const deleteSupervisor = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest<void>(`/api/supervisors/${id}`, {
    method: 'DELETE',
    locale,
  })
}
