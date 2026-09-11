import { apiRequest, Pagination } from '../api-client'

export interface AcademyPolicy {
  id: number
  content: string
  content_ar: string
  content_en?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ListAcademyPoliciesParams {
  is_active?: boolean
  per_page?: number
  page?: number
}

export interface CreateAcademyPolicyRequest {
  content_ar: string
  content_en?: string
  is_active?: boolean
}

export const listAcademyPolicies = async (
  params?: ListAcademyPoliciesParams,
  locale?: string
): Promise<{ policies: AcademyPolicy[]; pagination: Pagination }> => {
  const q = new URLSearchParams()
  if (params?.is_active !== undefined) q.append('is_active', String(params.is_active))
  if (params?.per_page) q.append('per_page', params.per_page.toString())
  if (params?.page) q.append('page', params.page.toString())
  const query = q.toString()
  return apiRequest<{ policies: AcademyPolicy[]; pagination: Pagination }>(
    `/api/academy-policies${query ? `?${query}` : ''}`,
    { locale }
  )
}

export const getAcademyPolicy = async (
  id: number,
  locale?: string
): Promise<AcademyPolicy> => {
  return apiRequest<AcademyPolicy>(`/api/academy-policies/${id}`, { locale })
}

export const createAcademyPolicy = async (
  data: CreateAcademyPolicyRequest,
  locale?: string
): Promise<AcademyPolicy> => {
  return apiRequest<AcademyPolicy>('/api/academy-policies', {
    method: 'POST',
    body: { content_ar: data.content_ar, content_en: data.content_en, is_active: data.is_active ?? true },
    locale,
  })
}

export const updateAcademyPolicy = async (
  id: number,
  data: Partial<CreateAcademyPolicyRequest>,
  locale?: string
): Promise<AcademyPolicy> => {
  return apiRequest<AcademyPolicy>(`/api/academy-policies/${id}`, {
    method: 'POST',
    body: data,
    locale,
  })
}

export const deleteAcademyPolicy = async (
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest<void>(`/api/academy-policies/${id}`, {
    method: 'DELETE',
    locale,
  })
}
