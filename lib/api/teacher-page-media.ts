import { apiRequest, Pagination } from '../api-client'

export type TeacherPageMediaType = 'image' | 'video'

export interface TeacherPageMediaTeacher {
  id: number
  name: string
}

export interface TeacherPageMedia {
  id: number
  teacher_id: number
  type: TeacherPageMediaType
  type_label?: string
  title?: string | null
  file_path?: string
  file_url: string
  mime_type?: string
  file_size?: number
  file_size_mb?: number
  teacher?: TeacherPageMediaTeacher
  created_at?: string
}

export interface TeacherPageMediaFilters {
  teacher_id?: number
  type?: TeacherPageMediaType
  per_page?: number
  page?: number
}

export interface TeacherPageMediaListResponse {
  teacher_page_media: TeacherPageMedia[]
  pagination?: Pagination
}

export const TEACHER_PAGE_MEDIA_TYPE_LABELS: Record<TeacherPageMediaType, string> = {
  image: 'صورة',
  video: 'فيديو',
}

export const listTeacherPageMedia = async (
  filters: TeacherPageMediaFilters = {},
  locale?: string
): Promise<TeacherPageMediaListResponse> => {
  const params = new URLSearchParams()
  if (filters.teacher_id) params.append('teacher_id', String(filters.teacher_id))
  if (filters.type) params.append('type', filters.type)
  if (filters.per_page) params.append('per_page', String(filters.per_page))
  if (filters.page) params.append('page', String(filters.page))
  const query = params.toString()

  const data = await apiRequest<TeacherPageMediaListResponse | TeacherPageMedia[]>(
    `/api/teacher-page-media${query ? `?${query}` : ''}`,
    { locale }
  )

  if (Array.isArray(data)) {
    return { teacher_page_media: data }
  }

  const items =
    data.teacher_page_media ??
    (data as { media?: TeacherPageMedia[] }).media ??
    []

  return {
    teacher_page_media: items,
    pagination: data.pagination,
  }
}

export const deleteTeacherPageMedia = async (id: number): Promise<void> => {
  await apiRequest(`/api/teacher-page-media/${id}`, { method: 'DELETE' })
}
