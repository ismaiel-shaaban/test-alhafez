import { apiRequest, Pagination } from '../api-client'

export type SessionSystemLogStatus = 'pending' | 'approved' | 'rejected'

export interface SessionSystemLogUserRef {
  id: number
  name: string
}

export interface SessionSystemLog {
  id: number
  student_id: number
  student?: SessionSystemLogUserRef
  teacher_id?: number | null
  teacher?: SessionSystemLogUserRef | null
  changed_by_user_id?: number | null
  changed_by_user?: SessionSystemLogUserRef | null
  status?: SessionSystemLogStatus
  status_label?: string
  rejection_reason?: string | null
  approved_by?: SessionSystemLogUserRef | null
  approved_at?: string | null
  rejected_by?: SessionSystemLogUserRef | null
  rejected_at?: string | null
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  created_at?: string
}

export interface SessionSystemLogsResponse {
  logs: SessionSystemLog[]
  pagination: Pagination
}

export interface SessionSystemLogsFilters {
  status?: SessionSystemLogStatus
  search?: string
  student_id?: number
  teacher_id?: number
  changed_by_user_id?: number
  per_page?: number
  page?: number
}

export const listSessionSystemLogs = async (
  filters: SessionSystemLogsFilters = {},
  locale?: string
): Promise<SessionSystemLogsResponse> => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.search) params.append('search', filters.search)
  if (filters.student_id !== undefined) params.append('student_id', filters.student_id.toString())
  if (filters.teacher_id !== undefined) params.append('teacher_id', filters.teacher_id.toString())
  if (filters.changed_by_user_id !== undefined) {
    params.append('changed_by_user_id', filters.changed_by_user_id.toString())
  }
  if (filters.per_page !== undefined) params.append('per_page', filters.per_page.toString())
  if (filters.page !== undefined) params.append('page', filters.page.toString())

  return apiRequest<SessionSystemLogsResponse>(
    `/api/session-system/logs${params.toString() ? `?${params.toString()}` : ''}`,
    { locale }
  )
}

export const approveSessionSystemLog = async (
  requestId: number,
  locale?: string
): Promise<SessionSystemLog> => {
  return apiRequest<SessionSystemLog>(`/api/session-system/logs/${requestId}/approve`, {
    method: 'POST',
    locale,
  })
}

export const rejectSessionSystemLog = async (
  requestId: number,
  rejectionReason: string,
  locale?: string
): Promise<SessionSystemLog> => {
  return apiRequest<SessionSystemLog>(`/api/session-system/logs/${requestId}/reject`, {
    method: 'POST',
    body: { rejection_reason: rejectionReason },
    locale,
  })
}
