import { apiRequest, PaginatedResponse } from '../api-client'

/** Single report inside a session (reports array) */
export interface SessionReport {
  id: number
  session_id: number
  student_id: number
  teacher_id: number
  new_memorization: string
  review: string
  new_memorization_level: string
  new_memorization_level_label?: string
  review_level: string
  review_level_label?: string
  notes?: string | null
  image?: string | null
  student?: { id: number; name: string }
  teacher?: { id: number; name: string }
  session?: {
    id: number
    session_date: string
    session_time: string
  }
  session_name?: string
  student_name?: string
  created_by?: { id: number; name: string }
  created_at: string
  updated_at: string
}

/** Student evaluation for a session (evaluation key on session) */
export interface SessionEvaluation {
  id: number
  session_id: number
  student_id: number
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
  created_at: string
}

export interface StudentSession {
  id: number
  student_id: number
  teacher_id?: number
  session_date: string
  session_time: string
  start_time?: string | null // وقت دخول المعلم (teacher entry time)
  student_joined_at?: string | null // وقت دخول الطالب
  day_of_week: string
  day_of_week_label?: string // Localized day label (e.g., "السبت", "Saturday")
  is_completed: boolean
  completed_at?: string | null
  status: string // "pending", "completed", "postponed", "absence", etc.
  status_label?: string // Localized status label
  new_date?: string | null
  new_time?: string | null
  reason?: string | null
  notes?: string | null
  session_link?: string | null
  session_number?: number | string // Student's session number within subscription
  subscription_month_number?: number | string | null // Student's subscription month number
  student?: {
    id: number
    name: string
    phone?: string | null
    country?: string | null
  }
  teacher?: {
    id: number
    name: string
    phone?: string | null
    session_link?: string | null
  }
  reports?: SessionReport[]
  previous_reports?: SessionReport[]
  evaluation?: SessionEvaluation
  created_at?: string
  updated_at?: string
}

export type SessionStatus = 'pending' | 'completed' | 'postponed' | 'absence'
export type SessionStatusFilter = SessionStatus | ''

export function getSessionStatusLabel(session: Pick<StudentSession, 'status' | 'status_label' | 'is_completed'>): string {
  if (session.status_label) return session.status_label
  if (session.status === 'absence') return 'غياب'
  if (session.is_completed || session.status === 'completed') return 'مكتملة'
  if (session.status === 'postponed') return 'مؤجلة'
  return 'قيد الانتظار'
}

export function getSessionStatusBadgeClass(session: Pick<StudentSession, 'status' | 'is_completed'>): string {
  if (session.status === 'absence') return 'bg-red-100 text-red-800'
  if (session.is_completed || session.status === 'completed') return 'bg-green-100 text-green-800'
  if (session.status === 'postponed') return 'bg-orange-100 text-orange-800'
  return 'bg-yellow-100 text-yellow-800'
}

export function getSessionCardClass(session: Pick<StudentSession, 'status' | 'is_completed'>): string {
  if (session.status === 'absence') return 'border-red-200 bg-red-50'
  if (session.is_completed || session.status === 'completed') return 'border-green-200 bg-green-50'
  if (session.status === 'postponed') return 'border-orange-200 bg-orange-50'
  return 'border-primary-200 bg-white'
}

export interface SessionFilters {
  student_id?: number
  teacher_id?: number
  is_completed?: boolean
  status?: SessionStatusFilter
  date_from?: string
  date_to?: string
  day_of_week?: string
  per_page?: number
  is_trial?: 0 | 1
}

export interface CreateSessionRequest {
  student_id: number
  teacher_id?: number
  session_date: string // YYYY-MM-DD
  session_time: string // HH:mm
  session_duration?: number
  notes?: string
}

// List sessions
export const listSessions = async (
  filters: SessionFilters = {},
  locale?: string
): Promise<{ sessions: StudentSession[]; pagination: any }> => {
  const params = new URLSearchParams()
  
  if (filters.student_id) params.append('student_id', filters.student_id.toString())
  if (filters.teacher_id) params.append('teacher_id', filters.teacher_id.toString())
  if (filters.is_completed !== undefined) params.append('is_completed', filters.is_completed.toString())
  if (filters.status) params.append('status', filters.status)
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.day_of_week) params.append('day_of_week', filters.day_of_week)
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.is_trial) params.append('is_trial', filters.is_trial.toString())

  const query = params.toString()
  // API returns: { status: true, message: "...", data: { sessions: [...], pagination: {...} } }
  return apiRequest<{ sessions: StudentSession[]; pagination: any }>(
    `/api/student-sessions${query ? `?${query}` : ''}`,
    { locale }
  )
}

// Get session
export const getSession = async (id: number): Promise<StudentSession> => {
  return apiRequest<StudentSession>(`/api/student-sessions/${id}`)
}

// Create session
export const createSession = async (data: CreateSessionRequest): Promise<StudentSession> => {
  return apiRequest<StudentSession>('/api/student-sessions', {
    method: 'POST',
    body: data,
  })
}

// Update session
export const updateSession = async (
  id: number,
  data: Partial<CreateSessionRequest & { is_completed?: boolean; status?: string }>
): Promise<StudentSession> => {
  return apiRequest<StudentSession>(`/api/student-sessions/${id}`, {
    method: 'POST',
    body: data,
  })
}

// Mark session as completed
export const completeSession = async (
  id: number,
  notes?: string
): Promise<StudentSession> => {
  return apiRequest<StudentSession>(`/api/student-sessions/${id}/complete`, {
    method: 'POST',
    body: notes ? { notes } : {},
  })
}

// Revert session from completed to pending
export const revertSessionToPending = async (id: number): Promise<StudentSession> => {
  return apiRequest<StudentSession>(`/api/student-sessions/${id}/revert-to-pending`, {
    method: 'POST',
  })
}

// Delete session
export const deleteSession = async (id: number): Promise<void> => {
  return apiRequest(`/api/student-sessions/${id}`, {
    method: 'DELETE',
  })
}

// Response type for getSessionsByDate
export interface SessionsByDateResponse {
  date: string
  sessions: StudentSession[]
  statistics: {
    total_sessions: number
    completed_sessions: number
    pending_sessions: number
  }
}

// Get sessions by date
export const getSessionsByDate = async (
  date: string, // YYYY-MM-DD
  isCompleted?: boolean,
  teacherId?: number,
  status?: SessionStatusFilter,
  withoutTeacher?: boolean,
  locale?: string
): Promise<SessionsByDateResponse> => {
  const params = new URLSearchParams()
  params.append('date', date)
  if (isCompleted !== undefined) {
    params.append('is_completed', isCompleted.toString())
  }
  if (teacherId !== undefined) {
    params.append('teacher_id', teacherId.toString())
  }
  if (status) {
    params.append('status', status)
  }
  if (withoutTeacher) {
    params.append('without_teacher', '1')
  }
  return apiRequest<SessionsByDateResponse>(
    `/api/student-sessions/by-date?${params.toString()}`,
    { locale }
  )
}

