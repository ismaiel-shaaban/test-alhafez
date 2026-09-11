import { apiRequest, Pagination } from '../api-client'

export interface ScheduleChangeRequest {
  id: number
  teacher_id: number
  student_id: number
  old_schedule: Array<{ day: string; time: string }>
  new_schedule: Array<{ day: string; time: string }>
  status: 'pending' | 'approved' | 'rejected'
  status_label?: string
  rejection_reason?: string
  approved_by?: number
  approved_at?: string
  rejected_by?: number
  rejected_at?: string
  teacher?: {
    id: number
    name: string
    specialization?: string
  }
  student?: {
    id: number
    name: string
    phone?: string
  }
  created_at?: string
  updated_at?: string
}

export interface ScheduleChangeRequestsResponse {
  requests: ScheduleChangeRequest[]
  pagination: Pagination
}

// Get all schedule change requests
export const getScheduleChangeRequests = async (
  filters: {
    teacher_id?: number
    student_id?: number
    status?: 'pending' | 'approved' | 'rejected'
    per_page?: number
    page?: number
  } = {},
  locale?: string
): Promise<ScheduleChangeRequestsResponse> => {
  const params = new URLSearchParams()
  if (filters.teacher_id) params.append('teacher_id', filters.teacher_id.toString())
  if (filters.student_id) params.append('student_id', filters.student_id.toString())
  if (filters.status) params.append('status', filters.status)
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())
  
  return apiRequest<ScheduleChangeRequestsResponse>(
    `/api/schedule-change-requests${params.toString() ? `?${params.toString()}` : ''}`,
    { locale }
  )
}

// Approve schedule change request
export const approveScheduleChangeRequest = async (
  id: number,
  locale?: string
): Promise<ScheduleChangeRequest> => {
  return apiRequest<ScheduleChangeRequest>(`/api/schedule-change-requests/${id}/approve`, {
    method: 'POST',
    locale,
  })
}

// Reject schedule change request
export const rejectScheduleChangeRequest = async (
  id: number,
  rejection_reason?: string,
  locale?: string
): Promise<ScheduleChangeRequest> => {
  return apiRequest<ScheduleChangeRequest>(`/api/schedule-change-requests/${id}/reject`, {
    method: 'POST',
    body: { rejection_reason },
    locale,
  })
}

// Delete schedule change request
export const deleteScheduleChangeRequest = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest(`/api/schedule-change-requests/${id}`, {
    method: 'DELETE',
    locale,
  })
}

