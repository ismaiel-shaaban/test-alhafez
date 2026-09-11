import { apiRequest, Pagination } from '../api-client'

export interface SupervisorSalary {
  id: number
  supervisor_id: number
  month: string // Y-m
  amount: number
  is_paid: boolean
  payment_proof_image?: string | null
  paid_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  supervisor?: { id: number; name: string; username: string }
}

export interface ListSupervisorSalariesParams {
  month?: string
  is_paid?: boolean
  per_page?: number
  page?: number
}

export interface CreateSupervisorSalaryRequest {
  month: string // Y-m
  amount: number
  is_paid?: boolean
  payment_proof_image?: File
  notes?: string
}

export const listSupervisorSalaries = async (
  supervisorId: number,
  params?: ListSupervisorSalariesParams,
  locale?: string
): Promise<{ salaries: SupervisorSalary[]; pagination: Pagination }> => {
  const q = new URLSearchParams()
  if (params?.month) q.append('month', params.month)
  if (params?.is_paid !== undefined) q.append('is_paid', String(params.is_paid))
  if (params?.per_page) q.append('per_page', params.per_page.toString())
  if (params?.page) q.append('page', params.page.toString())
  const query = q.toString()
  return apiRequest<{ salaries: SupervisorSalary[]; pagination: Pagination }>(
    `/api/supervisors/${supervisorId}/salaries${query ? `?${query}` : ''}`,
    { locale }
  )
}

export const getSupervisorSalary = async (
  supervisorId: number,
  salaryId: number,
  locale?: string
): Promise<SupervisorSalary> => {
  return apiRequest<SupervisorSalary>(
    `/api/supervisors/${supervisorId}/salaries/${salaryId}`,
    { locale }
  )
}

export const createSupervisorSalary = async (
  supervisorId: number,
  data: CreateSupervisorSalaryRequest,
  locale?: string
): Promise<SupervisorSalary> => {
  const formData = new FormData()
  formData.append('month', data.month)
  formData.append('amount', data.amount.toString())
  formData.append('is_paid', data.is_paid === true ? 'true' : 'false')
  if (data.payment_proof_image) formData.append('payment_proof_image', data.payment_proof_image)
  if (data.notes) formData.append('notes', data.notes)
  return apiRequest<SupervisorSalary>(
    `/api/supervisors/${supervisorId}/salaries`,
    { method: 'POST', body: formData, locale }
  )
}

export const updateSupervisorSalary = async (
  supervisorId: number,
  salaryId: number,
  data: Partial<CreateSupervisorSalaryRequest> & { is_paid?: boolean },
  locale?: string
): Promise<SupervisorSalary> => {
  const formData = new FormData()
  if (data.month) formData.append('month', data.month)
  if (data.amount !== undefined) formData.append('amount', data.amount.toString())
  if (data.is_paid !== undefined) formData.append('is_paid', data.is_paid === true ? 'true' : 'false')
  if (data.payment_proof_image) formData.append('payment_proof_image', data.payment_proof_image)
  if (data.notes !== undefined) formData.append('notes', data.notes)
  return apiRequest<SupervisorSalary>(
    `/api/supervisors/${supervisorId}/salaries/${salaryId}`,
    { method: 'POST', body: formData, locale }
  )
}

export const deleteSupervisorSalary = async (
  supervisorId: number,
  salaryId: number,
  locale?: string
): Promise<void> => {
  return apiRequest<void>(
    `/api/supervisors/${supervisorId}/salaries/${salaryId}`,
    { method: 'DELETE', locale }
  )
}
