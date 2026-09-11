import { apiRequest, PaginatedResponse } from '../api-client'

export interface Package {
  id: number
  name: string // Localized name based on Accept-Language
  name_ar: string
  name_en?: string
  price: number
  price_ar?: string
  price_en?: string
  price_label?: string
  features: string[] // Localized features based on Accept-Language
  features_ar: string[]
  features_en?: string[]
  is_popular: boolean
  students_count?: number
}

export interface CreatePackageRequest {
  name: string
  name_en?: string
  price: number
  price_ar?: string
  price_en?: string
  features: string[]
  features_en?: string[]
  is_popular?: boolean
}

// List packages
export const listPackages = async (
  isPopular?: boolean,
  perPage: number = 15,
  page: number = 1,
  locale?: string
): Promise<{ packages: Package[]; pagination: any }> => {
  const params = new URLSearchParams()
  if (isPopular !== undefined) params.append('is_popular', isPopular.toString())
  params.append('per_page', perPage.toString())
  params.append('page', page.toString())

  // API returns: { status: true, message: "...", data: { packages: [...], pagination: {...} } }
  return apiRequest<{ packages: Package[]; pagination: any }>(
    `/api/packages?${params.toString()}`,
    { locale }
  )
}

// Get package
export const getPackage = async (id: number): Promise<Package> => {
  return apiRequest<Package>(`/api/packages/${id}`)
}

// Create package
export const createPackage = async (data: CreatePackageRequest): Promise<Package> => {
  return apiRequest<Package>('/api/packages', {
    method: 'POST',
    body: data,
  })
}

// Update package
export const updatePackage = async (
  id: number,
  data: Partial<CreatePackageRequest>
): Promise<Package> => {
  return apiRequest<Package>(`/api/packages/${id}`, {
    method: 'POST',
    body: data,
  })
}

// Delete package
export const deletePackage = async (id: number): Promise<void> => {
  return apiRequest(`/api/packages/${id}`, {
    method: 'DELETE',
  })
}

