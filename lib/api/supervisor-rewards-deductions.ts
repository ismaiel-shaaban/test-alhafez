import { apiRequest, Pagination } from '../api-client'

export type SupervisorRewardDeductionType = 'reward' | 'deduction'

export interface SupervisorRewardDeduction {
  id: number
  supervisor_id: number
  type: SupervisorRewardDeductionType
  type_label: string
  title: string
  description?: string
  amount: number
  month: string // Y-m
  notes?: string
  created_at: string
  updated_at: string
  supervisor?: { id: number; name: string; username: string }
}

export interface ListSupervisorRewardsDeductionsParams {
  type?: SupervisorRewardDeductionType
  month?: string
  search?: string
  per_page?: number
  page?: number
}

export interface CreateSupervisorRewardDeductionRequest {
  type: SupervisorRewardDeductionType
  title: string
  description?: string
  amount: number
  month: string // Y-m
  notes?: string
}

export const listSupervisorRewardsDeductions = async (
  supervisorId: number,
  params?: ListSupervisorRewardsDeductionsParams,
  locale?: string
): Promise<{ rewards_deductions: SupervisorRewardDeduction[]; pagination: Pagination }> => {
  const q = new URLSearchParams()
  if (params?.type) q.append('type', params.type)
  if (params?.month) q.append('month', params.month)
  if (params?.search) q.append('search', params.search)
  if (params?.per_page) q.append('per_page', params.per_page.toString())
  if (params?.page) q.append('page', params.page.toString())
  const query = q.toString()
  return apiRequest<{ rewards_deductions: SupervisorRewardDeduction[]; pagination: Pagination }>(
    `/api/supervisors/${supervisorId}/rewards-deductions${query ? `?${query}` : ''}`,
    { locale }
  )
}

export const getSupervisorRewardDeduction = async (
  supervisorId: number,
  id: number,
  locale?: string
): Promise<SupervisorRewardDeduction> => {
  return apiRequest<SupervisorRewardDeduction>(
    `/api/supervisors/${supervisorId}/rewards-deductions/${id}`,
    { locale }
  )
}

export const createSupervisorRewardDeduction = async (
  supervisorId: number,
  data: CreateSupervisorRewardDeductionRequest,
  locale?: string
): Promise<SupervisorRewardDeduction> => {
  return apiRequest<SupervisorRewardDeduction>(
    `/api/supervisors/${supervisorId}/rewards-deductions`,
    { method: 'POST', body: data, locale }
  )
}

export const updateSupervisorRewardDeduction = async (
  supervisorId: number,
  id: number,
  data: Partial<CreateSupervisorRewardDeductionRequest>,
  locale?: string
): Promise<SupervisorRewardDeduction> => {
  return apiRequest<SupervisorRewardDeduction>(
    `/api/supervisors/${supervisorId}/rewards-deductions/${id}`,
    { method: 'POST', body: data, locale }
  )
}

export const deleteSupervisorRewardDeduction = async (
  supervisorId: number,
  id: number,
  locale?: string
): Promise<void> => {
  return apiRequest<void>(
    `/api/supervisors/${supervisorId}/rewards-deductions/${id}`,
    { method: 'DELETE', locale }
  )
}
