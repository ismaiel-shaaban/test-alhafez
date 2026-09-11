import { apiRequest, PaginatedResponse } from '../api-client'

export interface HonorBoardEntry {
  id: number
  student_id: number
  level: string // Localized level based on Accept-Language
  level_ar: string
  level_en?: string
  achievement: string // Localized achievement based on Accept-Language
  achievement_ar: string
  achievement_en?: string
  certificate_images: string[]
  student?: {
    id: number
    name: string
  }
}

export interface CreateHonorBoardRequest {
  student_id: number // Required
  level: string // Required, level in Arabic
  level_en?: string // Optional, level in English
  achievement: string // Required, achievement in Arabic
  achievement_en?: string // Optional, achievement in English
  certificate_images: File[] // Required, array of certificate image files (image files: jpeg, png, jpg, gif, max: 5MB each)
}

// List honor boards
export const listHonorBoards = async (
  studentId?: number,
  perPage: number = 15,
  page: number = 1,
  locale?: string
): Promise<{ honor_boards: HonorBoardEntry[]; pagination: any }> => {
  const params = new URLSearchParams()
  if (studentId) params.append('student_id', studentId.toString())
  params.append('per_page', perPage.toString())
  params.append('page', page.toString())

  // API returns: { status: true, message: "...", data: { honor_boards: [...], pagination: {...} } }
  return apiRequest<{ honor_boards: HonorBoardEntry[]; pagination: any }>(
    `/api/honor-boards?${params.toString()}`,
    { locale }
  )
}

// Get honor board entry
export const getHonorBoard = async (id: number): Promise<HonorBoardEntry> => {
  return apiRequest<HonorBoardEntry>(`/api/honor-boards/${id}`)
}

// Create honor board entry
export const createHonorBoard = async (
  data: CreateHonorBoardRequest
): Promise<HonorBoardEntry> => {
  // Use FormData for multipart/form-data (certificate images are files)
  const formData = new FormData()
  formData.append('student_id', data.student_id.toString())
  formData.append('level', data.level)
  if (data.level_en) formData.append('level_en', data.level_en)
  formData.append('achievement', data.achievement)
  if (data.achievement_en) formData.append('achievement_en', data.achievement_en)
  
  // Append each certificate image file
  data.certificate_images.forEach((file, index) => {
    formData.append(`certificate_images[${index}]`, file)
  })
  
  return apiRequest<HonorBoardEntry>('/api/honor-boards', {
    method: 'POST',
    body: formData,
  })
}

// Update honor board entry
export const updateHonorBoard = async (
  id: number,
  data: Partial<CreateHonorBoardRequest>
): Promise<HonorBoardEntry> => {
  // If certificate_images are provided, use FormData for multipart/form-data
  if (data.certificate_images && data.certificate_images.length > 0) {
    const formData = new FormData()
    if (data.student_id !== undefined) formData.append('student_id', data.student_id.toString())
    if (data.level) formData.append('level', data.level)
    if (data.level_en) formData.append('level_en', data.level_en)
    if (data.achievement) formData.append('achievement', data.achievement)
    if (data.achievement_en) formData.append('achievement_en', data.achievement_en)
    
    // Append each certificate image file
    data.certificate_images.forEach((file, index) => {
      formData.append(`certificate_images[${index}]`, file)
    })
    
    return apiRequest<HonorBoardEntry>(`/api/honor-boards/${id}`, {
      method: 'POST',
      body: formData,
    })
  }
  
  // Otherwise, use JSON
  return apiRequest<HonorBoardEntry>(`/api/honor-boards/${id}`, {
    method: 'POST',
    body: data,
  })
}

// Delete honor board entry
export const deleteHonorBoard = async (id: number): Promise<void> => {
  return apiRequest(`/api/honor-boards/${id}`, {
    method: 'DELETE',
  })
}

