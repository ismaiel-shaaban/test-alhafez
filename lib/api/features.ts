import { apiRequest, Pagination } from '../api-client'

export interface Feature {
  id: number
  title: string // Localized title based on Accept-Language
  title_ar: string
  title_en?: string
  description: string // Localized description based on Accept-Language
  description_ar: string
  description_en?: string
  icon?: string
  order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateFeatureRequest {
  title: string
  title_en?: string
  description: string
  description_en?: string
  icon?: string
  order?: number
  is_active?: boolean
}

export interface FeatureFilters {
  is_active?: boolean
  per_page?: number
  page?: number
}

// List features
export const listFeatures = async (
  filters: FeatureFilters = {},
  locale?: string
): Promise<{ features: Feature[]; pagination: Pagination }> => {
  const params = new URLSearchParams()
  
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString())
  if (filters.per_page) params.append('per_page', filters.per_page.toString())
  if (filters.page) params.append('page', filters.page.toString())

  const query = params.toString()
  // API returns: { status: true, message: "...", data: { features: [...], pagination: {...} } }
  return apiRequest<{ features: Feature[]; pagination: Pagination }>(
    `/api/features${query ? `?${query}` : ''}`,
    { locale }
  )
}

// Get feature
export const getFeature = async (id: number, locale?: string): Promise<Feature> => {
  return apiRequest<Feature>(`/api/features/${id}`, { locale })
}

// Create feature
export const createFeature = async (data: CreateFeatureRequest): Promise<Feature> => {
  return apiRequest<Feature>('/api/features', {
    method: 'POST',
    body: data,
  })
}

// Update feature
export const updateFeature = async (
  id: number,
  data: Partial<CreateFeatureRequest>
): Promise<Feature> => {
  return apiRequest<Feature>(`/api/features/${id}`, {
    method: 'POST',
    body: data,
  })
}

// Delete feature
export const deleteFeature = async (id: number): Promise<void> => {
  return apiRequest(`/api/features/${id}`, {
    method: 'DELETE',
  })
}

