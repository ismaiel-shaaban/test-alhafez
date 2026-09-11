import { apiRequest } from '../api-client'

export type TeacherStudentsPauseMode = 'immediate' | 'temporary'

export interface BulkPreviewStudent {
  id: number
  name?: string
  phone?: string
  subscription_status?: string
  status?: string
  can_pause?: boolean
  can_resume?: boolean
  pause_eligible?: boolean
  resume_eligible?: boolean
  reason?: string | null
  message?: string | null
}

export interface BulkPreviewResponse {
  teacher_id?: number
  teacher?: { id: number; name?: string }
  students?: BulkPreviewStudent[]
  summary?: {
    total?: number
    can_pause?: number
    can_resume?: number
    pause_eligible?: number
    resume_eligible?: number
  }
}

export interface PauseTeacherStudentsRequest {
  teacher_id: number
  mode: TeacherStudentsPauseMode
  pause_from?: string
  pause_to?: string
  student_ids?: number[]
}

export interface ResumeTeacherStudentsRequest {
  teacher_id: number
  resume_date: string
  student_ids?: number[]
}

export interface BulkActionResponse {
  message?: string
  teacher_id?: number
  mode?: TeacherStudentsPauseMode
  paused_count?: number
  resumed_count?: number
  affected_count?: number
  failed_count?: number
  student_ids?: number[]
  [key: string]: unknown
}

function normalizePreviewStudents(data: unknown): BulkPreviewStudent[] {
  if (!data || typeof data !== 'object') return []
  const obj = data as Record<string, unknown>
  const raw =
    obj.students ??
    obj.teacher_students ??
    (Array.isArray(data) ? data : null)
  if (!Array.isArray(raw)) return []

  return raw.map((item) => {
    const row = item as Record<string, unknown>
    const student = (row.student as Record<string, unknown> | undefined) ?? row
    const id = Number(student.id ?? row.student_id ?? row.id)
    return {
      id,
      name: String(student.name ?? row.student_name ?? row.name ?? ''),
      phone: student.phone != null ? String(student.phone) : undefined,
      subscription_status: String(
        student.subscription_status ?? row.subscription_status ?? row.status ?? ''
      ) || undefined,
      status: row.status != null ? String(row.status) : undefined,
      can_pause: Boolean(row.can_pause ?? row.pause_eligible),
      can_resume: Boolean(row.can_resume ?? row.resume_eligible),
      pause_eligible: row.pause_eligible != null ? Boolean(row.pause_eligible) : undefined,
      resume_eligible: row.resume_eligible != null ? Boolean(row.resume_eligible) : undefined,
      reason: row.reason != null ? String(row.reason) : row.message != null ? String(row.message) : null,
      message: row.message != null ? String(row.message) : undefined,
    }
  }).filter((s) => !Number.isNaN(s.id))
}

export function studentCanPause(student: BulkPreviewStudent): boolean {
  return student.can_pause === true || student.pause_eligible === true
}

export function studentCanResume(student: BulkPreviewStudent): boolean {
  return student.can_resume === true || student.resume_eligible === true
}

export const getTeacherStudentsBulkPreview = async (
  teacherId: number,
  locale?: string
): Promise<BulkPreviewResponse> => {
  const data = await apiRequest<BulkPreviewResponse | Record<string, unknown>>(
    `/api/teacher-students/subscriptions/bulk-preview?teacher_id=${teacherId}`,
    { locale }
  )
  const students = normalizePreviewStudents(data)
  const summary =
    data && typeof data === 'object' && 'summary' in data
      ? (data.summary as BulkPreviewResponse['summary'])
      : {
          total: students.length,
          can_pause: students.filter(studentCanPause).length,
          can_resume: students.filter(studentCanResume).length,
        }
  return {
    teacher_id: (data as BulkPreviewResponse)?.teacher_id ?? teacherId,
    teacher: (data as BulkPreviewResponse)?.teacher,
    students,
    summary,
  }
}

export const pauseTeacherStudentsSubscriptions = async (
  body: PauseTeacherStudentsRequest,
  locale?: string
): Promise<BulkActionResponse> => {
  return apiRequest<BulkActionResponse>('/api/teacher-students/subscriptions/pause', {
    method: 'POST',
    body,
    locale,
  })
}

export const resumeTeacherStudentsSubscriptions = async (
  body: ResumeTeacherStudentsRequest,
  locale?: string
): Promise<BulkActionResponse> => {
  return apiRequest<BulkActionResponse>('/api/teacher-students/subscriptions/resume', {
    method: 'POST',
    body,
    locale,
  })
}
