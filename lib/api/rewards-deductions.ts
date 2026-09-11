import { apiRequest, Pagination } from '../api-client'

export type RewardDeductionType = 'reward' | 'deduction'

export interface RewardDeduction {
  id: number
  teacher_id: number
  type: RewardDeductionType
  type_label: string
  title: string
  description?: string
  amount: number
  month: string // Y-m
  notes?: string
  created_at: string
  updated_at: string
  teacher?: { id: number; name: string }
}

export interface ListRewardsDeductionsParams {
  type?: RewardDeductionType
  month?: string
  search?: string
  per_page?: number
  page?: number
}

export interface CreateRewardDeductionRequest {
  type: RewardDeductionType
  title: string
  description?: string
  amount: number
  month: string // Y-m
  notes?: string
}

export const listRewardsDeductions = async (
  teacherId: number,
  params?: ListRewardsDeductionsParams,
  locale?: string
): Promise<{ rewards_deductions: RewardDeduction[]; pagination: Pagination }> => {
  const q = new URLSearchParams()
  if (params?.type) q.append('type', params.type)
  if (params?.month) q.append('month', params.month)
  if (params?.search) q.append('search', params.search)
  if (params?.per_page) q.append('per_page', params.per_page.toString())
  if (params?.page) q.append('page', params.page.toString())
  const query = q.toString()
  return apiRequest<{ rewards_deductions: RewardDeduction[]; pagination: Pagination }>(
    `/api/teachers/${teacherId}/rewards-deductions${query ? `?${query}` : ''}`,
    { locale }
  )
}

export const getRewardDeduction = async (
  teacherId: number,
  id: number,
  locale?: string
): Promise<RewardDeduction> => {
  return apiRequest<RewardDeduction>(
    `/api/teachers/${teacherId}/rewards-deductions/${id}`,
    { locale }
  )
}

export const createRewardDeduction = async (
  teacherId: number,
  data: CreateRewardDeductionRequest,
  locale?: string
): Promise<RewardDeduction> => {
  return apiRequest<RewardDeduction>(
    `/api/teachers/${teacherId}/rewards-deductions`,
    { method: 'POST', body: data, locale }
  )
}

export const updateRewardDeduction = async (
  teacherId: number,
  id: number,
  data: Partial<CreateRewardDeductionRequest>,
  locale?: string
): Promise<RewardDeduction> => {
  return apiRequest<RewardDeduction>(
    `/api/teachers/${teacherId}/rewards-deductions/${id}`,
    { method: 'POST', body: data, locale }
  )
}

export const deleteRewardDeduction = async (
  teacherId: number,
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest<void>(
    `/api/teachers/${teacherId}/rewards-deductions/${id}`,
    { method: 'DELETE', locale }
  )
}
