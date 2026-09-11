import { apiRequest, Pagination } from '../api-client'

export type ComplaintType = 'student' | 'teacher'
export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

export interface Complaint {
  id: number
  complaint_type: ComplaintType
  complaint_type_label?: string
  student_id: number | null
  student: { id: number; name: string } | null
  teacher_id: number | null
  teacher: { id: number; name: string } | null
  against_student_id: number | null
  against_student: { id: number; name: string } | null
  against_teacher_id: number | null
  against_teacher: { id: number; name: string } | null
  subject: string
  message: string
  status: ComplaintStatus
  status_label?: string
  assigned_to_id: number | null
  assigned_to: { id: number; name: string } | null
  admin_response: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface ComplaintsFilters {
  complaint_type?: ComplaintType | ''
  status?: ComplaintStatus | ''
  student_id?: number
  teacher_id?: number
  per_page?: number
  page?: number
}

export interface ComplaintsResponse {
  complaints: Complaint[]
  pagination: Pagination
}

export const getComplaints = async (
  filters: ComplaintsFilters = {},
  locale?: string
): Promise<ComplaintsResponse> => {
  const params = new URLSearchParams()
  if (filters.complaint_type) params.append('complaint_type', filters.complaint_type)
  if (filters.status) params.append('status', filters.status)
  if (filters.student_id) params.append('student_id', filters.student_id.toString())
  if (filters.teacher_id) params.append('teacher_id', filters.teacher_id.toString())
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())

  const query = params.toString()
  return apiRequest<ComplaintsResponse>(
    `/api/complaints${query ? `?${query}` : ''}`,
    { locale }
  )
}

export interface UpdateComplaintRequest {
  status?: ComplaintStatus
  admin_response?: string | null
}

export const updateComplaint = async (
  id: number,
  body: UpdateComplaintRequest,
  locale?: string
): Promise<Complaint> => {
  return apiRequest<Complaint>(`/api/complaints/${id}`, {
    method: 'POST',
    body,
    locale,
  })
}
