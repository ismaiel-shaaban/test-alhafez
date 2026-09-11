import { apiRequest, Pagination } from '../api-client'

export interface Lesson {
  id: number
  title: string // Localized title based on Accept-Language
  title_ar: string
  title_en?: string
  localized_title: string
  description: string // Localized description based on Accept-Language
  description_ar: string
  description_en?: string
  localized_description: string
  video: string // Video URL
  created_at?: string
  updated_at?: string
}

export interface CreateLessonRequest {
  title: string // Required, Arabic title
  title_en?: string // Optional, English title
  description: string // Required, Arabic description
  description_en?: string // Optional, English description
  video?: File // Required, video file (mp4, avi, mov, wmv, flv, webm, max: 50MB)
}

export interface LessonFilters {
  per_page?: number
  page?: number
}

// List lessons
export const listLessons = async (
  filters: LessonFilters = {},
  locale?: string
): Promise<{ lessons: Lesson[]; pagination: Pagination }> => {
  const params = new URLSearchParams()
  
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())

  const query = params.toString()
  // API returns: { status: true, message: "...", data: { lessons: [...], pagination: {...} } }
  return apiRequest<{ lessons: Lesson[]; pagination: Pagination }>(
    `/api/lessons${query ? `?${query}` : ''}`,
    { locale }
  )
}

// Get lesson
export const getLesson = async (id: number, locale?: string): Promise<Lesson> => {
  return apiRequest<Lesson>(`/api/lessons/${id}`, { locale })
}

// Create lesson
export const createLesson = async (data: CreateLessonRequest): Promise<Lesson> => {
  // If video is provided, use FormData for multipart/form-data
  if (data.video) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.title_en) formData.append('title_en', data.title_en)
    formData.append('description', data.description)
    if (data.description_en) formData.append('description_en', data.description_en)
    formData.append('video', data.video)
    
    return apiRequest<Lesson>('/api/lessons', {
      method: 'POST',
      body: formData,
    })
  }
  
  // Otherwise, use JSON (though video is required)
  return apiRequest<Lesson>('/api/lessons', {
    method: 'POST',
    body: data,
  })
}

// Update lesson
export const updateLesson = async (
  id: number,
  data: Partial<CreateLessonRequest>
): Promise<Lesson> => {
  // If video is provided, use FormData for multipart/form-data
  if (data.video) {
    const formData = new FormData()
    if (data.title) formData.append('title', data.title)
    if (data.title_en) formData.append('title_en', data.title_en)
    if (data.description) formData.append('description', data.description)
    if (data.description_en) formData.append('description_en', data.description_en)
    formData.append('video', data.video)
    
    return apiRequest<Lesson>(`/api/lessons/${id}`, {
      method: 'POST',
      body: formData,
    })
  }
  
  // Otherwise, use JSON
  return apiRequest<Lesson>(`/api/lessons/${id}`, {
    method: 'POST',
    body: data,
  })
}

// Delete lesson
export const deleteLesson = async (id: number): Promise<void> => {
  return apiRequest(`/api/lessons/${id}`, {
    method: 'DELETE',
  })
}

