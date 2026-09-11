import { apiRequest, Pagination } from '../api-client'

/** Nested student as returned on session-evaluation list/detail */
export interface SessionEvaluationStudent {
  id: number
  name: string
  phone?: string
}

/** Nested teacher as returned on session-evaluation list/detail */
export interface SessionEvaluationTeacher {
  id: number
  name: string
  phone?: string
}

export interface SessionEvaluation {
  id: number
  session_id: number | null
  student_subscription_id?: number
  student_id: number
  teacher_id?: number
  satisfaction_level: string
  satisfaction_level_label?: string
  student_progress: string
  student_progress_label?: string
  noise_in_session: string
  noise_in_session_label?: string
  internet_quality: string
  internet_quality_label?: string
  teacher_camera_on: string
  teacher_camera_on_label?: string
  screen_sharing_on: string
  screen_sharing_on_label?: string
  academy_advantages?: string | null
  notes?: string | null
  would_recommend: string
  would_recommend_label?: string
  student?: SessionEvaluationStudent
  teacher?: SessionEvaluationTeacher
  is_monthly_subscription_evaluation?: boolean
  evaluation_year?: number
  evaluation_month?: number
  evaluation_period?: string
  created_at: string
  updated_at?: string
}

export interface SessionEvaluationsFilters {
  student_id?: number
  satisfaction_level?: string
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}

export interface SessionEvaluationsResponse {
  evaluations: SessionEvaluation[]
  pagination: Pagination
}

export const getSessionEvaluations = async (
  filters: SessionEvaluationsFilters = {},
  locale?: string
): Promise<SessionEvaluationsResponse> => {
  const params = new URLSearchParams()
  if (filters.student_id) params.append('student_id', filters.student_id.toString())
  if (filters.satisfaction_level) params.append('satisfaction_level', filters.satisfaction_level)
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())

  const query = params.toString()
  return apiRequest<SessionEvaluationsResponse>(
    `/api/session-evaluations${query ? `?${query}` : ''}`,
    { locale }
  )
}
