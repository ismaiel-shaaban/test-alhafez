import { apiRequest, PaginatedResponse } from '../api-client'

export interface Review {
  id: number
  type?: 'review' | 'rating' // Type of entry
  student_id?: number // Optional, nullable for public ratings
  package_id?: number // Optional, nullable
  rating: number
  review: string // Localized review based on lang header
  review_ar: string
  review_en?: string
  media_file?: string // Media file URL (image or video)
  student?: {
    id: number
    name: string
  }
  package?: {
    id: number
    name: string
    name_en?: string
  }
  created_at?: string
}

export interface ReviewFilters {
  type?: 'review' | 'rating' // Filter by type
  rating?: number
  package_id?: number
  student_id?: number
  per_page?: number
  page?: number
}

export interface CreateReviewRequest {
  type?: 'review' | 'rating' // Optional, default: 'review'
  student_id?: number // Optional, nullable for public ratings
  package_id?: number // Optional, nullable
  rating: number // Required, 1-5
  review: string // Required, review in Arabic
  review_en?: string // Optional, review in English
  media_file?: File // Optional, media file (image or video) - file upload (jpeg, png, jpg, gif, mp4, mov, max: 10MB)
}

// List reviews
export const listReviews = async (
  filters: ReviewFilters = {},
  locale?: string
): Promise<{ reviews: Review[]; pagination: any }> => {
  const params = new URLSearchParams()
  
  if (filters.type) params.append('type', filters.type)
  if (filters.rating) params.append('rating', filters.rating.toString())
  if (filters.package_id) params.append('package_id', filters.package_id.toString())
  if (filters.student_id) params.append('student_id', filters.student_id.toString())
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())

  const query = params.toString()
  // API returns: { status: true, message: "...", data: { reviews: [...], pagination: {...} } }
  return apiRequest<{ reviews: Review[]; pagination: any }>(
    `/api/reviews${query ? `?${query}` : ''}`,
    { locale }
  )
}

// Get review
export const getReview = async (id: number): Promise<Review> => {
  return apiRequest<Review>(`/api/reviews/${id}`)
}

// Create review
export const createReview = async (data: CreateReviewRequest): Promise<Review> => {
  // If media_file is provided, use FormData for multipart/form-data
  if (data.media_file) {
    const formData = new FormData()
    if (data.type) formData.append('type', data.type)
    if (data.student_id) formData.append('student_id', data.student_id.toString())
    if (data.package_id) formData.append('package_id', data.package_id.toString())
    formData.append('rating', data.rating.toString())
    formData.append('review', data.review)
    if (data.review_en) formData.append('review_en', data.review_en)
    formData.append('media_file', data.media_file)
    
    return apiRequest<Review>('/api/reviews', {
      method: 'POST',
      body: formData,
    })
  }
  
  // Otherwise, use JSON
  return apiRequest<Review>('/api/reviews', {
    method: 'POST',
    body: data,
  })
}

// Update review
export const updateReview = async (
  id: number,
  data: Partial<CreateReviewRequest>
): Promise<Review> => {
  // If media_file is provided, use FormData for multipart/form-data
  if (data.media_file) {
    const formData = new FormData()
    if (data.type) formData.append('type', data.type)
    if (data.student_id !== undefined) formData.append('student_id', data.student_id?.toString() || '')
    if (data.package_id !== undefined) formData.append('package_id', data.package_id?.toString() || '')
    if (data.rating !== undefined) formData.append('rating', data.rating.toString())
    if (data.review) formData.append('review', data.review)
    if (data.review_en) formData.append('review_en', data.review_en)
    formData.append('media_file', data.media_file)
    
    return apiRequest<Review>(`/api/reviews/${id}`, {
      method: 'POST',
      body: formData,
    })
  }
  
  // Otherwise, use JSON
  return apiRequest<Review>(`/api/reviews/${id}`, {
    method: 'POST',
    body: data,
  })
}

// Delete review
export const deleteReview = async (id: number): Promise<void> => {
  return apiRequest(`/api/reviews/${id}`, {
    method: 'DELETE',
  })
}

