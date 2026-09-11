import { apiRequest, Pagination } from '../api-client'

export interface StudentDeletionRequest {
  id: number
  teacher_id: number
  student_id: number
  type?: 'full' | 'partial'
  reason?: string
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

export interface StudentDeletionRequestsResponse {
  requests: StudentDeletionRequest[]
  pagination: Pagination
}

// Get all student deletion requests
export const getStudentDeletionRequests = async (
  filters: {
    teacher_id?: number
    student_id?: number
    status?: 'pending' | 'approved' | 'rejected'
    per_page?: number
    page?: number
  } = {},
  locale?: string
): Promise<StudentDeletionRequestsResponse> => {
  const params = new URLSearchParams()
  if (filters.teacher_id) params.append('teacher_id', filters.teacher_id.toString())
  if (filters.student_id) params.append('student_id', filters.student_id.toString())
  if (filters.status) params.append('status', filters.status)
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())
  
  return apiRequest<StudentDeletionRequestsResponse>(
    `/api/student-deletion-requests${params.toString() ? `?${params.toString()}` : ''}`,
    { locale }
  )
}

// Approve student deletion request
export const approveStudentDeletionRequest = async (
  id: number,
  locale?: string
): Promise<StudentDeletionRequest> => {
  return apiRequest<StudentDeletionRequest>(`/api/student-deletion-requests/${id}/approve`, {
    method: 'POST',
    locale,
  })
}

// Reject student deletion request
export const rejectStudentDeletionRequest = async (
  id: number,
  rejection_reason?: string,
  locale?: string
): Promise<StudentDeletionRequest> => {
  return apiRequest<StudentDeletionRequest>(`/api/student-deletion-requests/${id}/reject`, {
    method: 'POST',
    body: { rejection_reason },
    locale,
  })
}

// Delete student deletion request
export const deleteStudentDeletionRequest = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest(`/api/student-deletion-requests/${id}`, {
    method: 'DELETE',
    locale,
  })
}

